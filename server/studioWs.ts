import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';

export interface AnnotationPoint {
  x: number;
  y: number;
}

export type AnnotationTool = 'pen' | 'highlighter' | 'laser' | 'arrow' | 'rect' | 'circle';

export interface AnnotationStroke {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  tool: AnnotationTool;
  color: string;
  width: number;
  opacity: number;
  points: AnnotationPoint[];
  timestamp: number;
}

export interface StickyNote {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  text: string;
  color: string;
  timestamp: number;
  pinned?: boolean;
}

export interface ParticipantCursor {
  userId: string;
  userName: string;
  userColor: string;
  x: number;
  y: number;
  lastActive: number;
  isDrawing?: boolean;
}

export type EmotionState =
  | 'confident'
  | 'hesitant'
  | 'joyful'
  | 'energetic'
  | 'calm'
  | 'anxious'
  | 'neutral'
  | 'fatigued';

export interface SentimentTelemetry {
  emotion: EmotionState;
  confidenceScore: number;
  sentimentIndex: number;
  valence: number;
  arousal: number;
  speechPaceModifier: number;
  recommendedSpeed: number;
  faceTracked: boolean;
  timestamp: number;
  feedbackAdvice?: string;
  rawSignals?: {
    smile: number;
    browFurrow: number;
    eyeContact: number;
    headStability: number;
    speechCadence: number;
  };
}

interface RoomParticipant {
  ws: WebSocket;
  user: ParticipantCursor;
}

interface RoomState {
  roomId: string;
  strokes: AnnotationStroke[];
  stickyNotes: StickyNote[];
  participants: Map<string, RoomParticipant>;
  currentSentiment: SentimentTelemetry;
  activePrompterSpeed: number;
  lastActivity: number;
}

const DEFAULT_SENTIMENT: SentimentTelemetry = {
  emotion: 'confident',
  confidenceScore: 92,
  sentimentIndex: 0.85,
  valence: 0.8,
  arousal: 0.7,
  speechPaceModifier: 1.0,
  recommendedSpeed: 2.0,
  faceTracked: true,
  timestamp: Date.now(),
  feedbackAdvice: 'Optimal poise & steady eye contact. Teleprompter pacing synchronized.',
  rawSignals: {
    smile: 78,
    browFurrow: 12,
    eyeContact: 95,
    headStability: 88,
    speechCadence: 145,
  },
};

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      roomId,
      strokes: [],
      stickyNotes: [
        {
          id: `sticky_welcome_${Date.now()}`,
          userId: 'system',
          userName: 'Studio Host',
          userColor: '#06b6d4',
          x: 68,
          y: 18,
          text: '💡 Live Collab: Draw, point lasers, or pin sticky notes on the camera stream in real time!',
          color: '#06b6d4',
          timestamp: Date.now(),
          pinned: true,
        },
      ],
      participants: new Map(),
      currentSentiment: { ...DEFAULT_SENTIMENT, timestamp: Date.now() },
      activePrompterSpeed: 2.0,
      lastActivity: Date.now(),
    };
    rooms.set(roomId, room);
  }
  return room;
}

function broadcastToRoom(room: RoomState, payload: Record<string, unknown>, excludeWs?: WebSocket) {
  const messageStr = JSON.stringify(payload);
  for (const [, participant] of room.participants) {
    if (participant.ws !== excludeWs && participant.ws.readyState === WebSocket.OPEN) {
      try {
        participant.ws.send(messageStr);
      } catch (err) {
        console.warn('[StudioWS] Broadcast send error:', err);
      }
    }
  }
}

/**
 * Intelligent Real-Time Sentiment & Speech Pacing Engine
 * Dynamically adjusts teleprompter speed according to presenter emotional metrics
 */
export function calculateAdaptivePrompterSpeed(
  sentiment: Partial<SentimentTelemetry>,
  baseSpeed: number = 2.0
): { recommendedSpeed: number; feedbackAdvice: string; modifier: number } {
  const emotion = sentiment.emotion || 'neutral';
  let modifier = 1.0;
  let feedback = 'Normal pacing maintained.';

  switch (emotion) {
    case 'confident':
      modifier = 1.15;
      feedback = 'High confidence & poised delivery. Pacing slightly elevated for crisp flow (+15%).';
      break;
    case 'energetic':
    case 'joyful':
      modifier = 1.25;
      feedback = 'Dynamic energy detected! Script scrolling accelerated (+25%) to match lively cadence.';
      break;
    case 'hesitant':
      modifier = 0.75;
      feedback = 'Hesitation / pause detected. Teleprompter eased down (-25%) to give you time to articulate.';
      break;
    case 'anxious':
      modifier = 0.7;
      feedback = 'Stage anxiety detected. Teleprompter slowed (-30%) with steady guide to restore composure.';
      break;
    case 'fatigued':
      modifier = 0.65;
      feedback = 'Vocal fatigue / slow pace. Teleprompter slowed (-35%) for effortless readability.';
      break;
    case 'calm':
    case 'neutral':
    default:
      modifier = 1.0;
      feedback = 'Calm & balanced tempo. Teleprompter maintaining standard presentation rate.';
      break;
  }

  // Factor in raw signals if available
  if (sentiment.rawSignals?.speechCadence) {
    const cadence = sentiment.rawSignals.speechCadence;
    if (cadence > 175) modifier *= 1.1; // Fast speaker
    else if (cadence < 110) modifier *= 0.85; // Slow deliberate speaker
  }

  const calculated = +(baseSpeed * modifier).toFixed(1);
  const clampedSpeed = Math.max(0.5, Math.min(6.0, calculated));

  return {
    recommendedSpeed: clampedSpeed,
    feedbackAdvice: feedback,
    modifier: +modifier.toFixed(2),
  };
}

export function setupStudioWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws/studio' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId = 'main_studio';
    let currentUserId = '';

    ws.on('message', (raw: string | Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        const { type, roomId = 'main_studio' } = msg;
        currentRoomId = roomId;
        const room = getOrCreateRoom(roomId);
        room.lastActivity = Date.now();

        switch (type) {
          case 'join': {
            const { user } = msg;
            if (!user?.id) return;
            currentUserId = user.id;

            const participantData: ParticipantCursor = {
              userId: user.id,
              userName: user.name || 'Anonymous Presenter',
              userColor: user.color || '#06b6d4',
              x: 50,
              y: 50,
              lastActive: Date.now(),
            };

            room.participants.set(user.id, { ws, user: participantData });

            // Send initial state to the newly joined client
            const participantsList = Array.from(room.participants.values()).map((p) => p.user);
            ws.send(
              JSON.stringify({
                type: 'room_init',
                roomId,
                strokes: room.strokes,
                stickyNotes: room.stickyNotes,
                participants: participantsList,
                currentSentiment: room.currentSentiment,
                activePrompterSpeed: room.activePrompterSpeed,
                timestamp: Date.now(),
              })
            );

            // Broadcast join to peers
            broadcastToRoom(
              room,
              {
                type: 'user_joined',
                roomId,
                user: participantData,
                participantsCount: room.participants.size,
              },
              ws
            );
            break;
          }

          case 'stroke_add': {
            const { stroke } = msg;
            if (!stroke?.id) return;

            // Idempotency: prevent duplicates
            if (!room.strokes.some((s) => s.id === stroke.id)) {
              room.strokes.push(stroke);
              // Max 200 strokes retained in memory
              if (room.strokes.length > 200) {
                room.strokes.shift();
              }
            }

            broadcastToRoom(room, { type: 'stroke_add', roomId, stroke }, ws);
            break;
          }

          case 'stroke_undo': {
            const { strokeId, userId } = msg;
            if (strokeId) {
              room.strokes = room.strokes.filter((s) => s.id !== strokeId);
            } else if (userId) {
              for (let i = room.strokes.length - 1; i >= 0; i--) {
                if (room.strokes[i].userId === userId) {
                  room.strokes.splice(i, 1);
                  break;
                }
              }
            }
            broadcastToRoom(room, { type: 'stroke_undo', roomId, strokeId, userId });
            break;
          }

          case 'annotation_clear': {
            const { userId } = msg;
            if (msg.clearAll) {
              room.strokes = [];
            } else if (userId) {
              room.strokes = room.strokes.filter((s) => s.userId !== userId);
            } else {
              room.strokes = [];
            }
            broadcastToRoom(room, { type: 'annotation_clear', roomId, userId });
            break;
          }

          case 'sticky_add': {
            const { note } = msg;
            if (!note?.id) return;
            if (!room.stickyNotes.some((n) => n.id === note.id)) {
              room.stickyNotes.push(note);
              if (room.stickyNotes.length > 50) {
                room.stickyNotes.shift();
              }
            }
            broadcastToRoom(room, { type: 'sticky_add', roomId, note }, ws);
            break;
          }

          case 'sticky_update': {
            const { note } = msg;
            if (!note?.id) return;
            const idx = room.stickyNotes.findIndex((n) => n.id === note.id);
            if (idx !== -1) {
              room.stickyNotes[idx] = { ...room.stickyNotes[idx], ...note };
            }
            broadcastToRoom(room, { type: 'sticky_update', roomId, note }, ws);
            break;
          }

          case 'sticky_delete': {
            const { noteId } = msg;
            if (!noteId) return;
            room.stickyNotes = room.stickyNotes.filter((n) => n.id !== noteId);
            broadcastToRoom(room, { type: 'sticky_delete', roomId, noteId }, ws);
            break;
          }

          case 'cursor_move': {
            const { cursor } = msg;
            if (!cursor?.userId) return;
            const existing = room.participants.get(cursor.userId);
            if (existing) {
              existing.user.x = cursor.x;
              existing.user.y = cursor.y;
              existing.user.lastActive = Date.now();
              existing.user.isDrawing = cursor.isDrawing;
            }
            broadcastToRoom(room, { type: 'cursor_move', roomId, cursor }, ws);
            break;
          }

          case 'sentiment_submit': {
            const rawSentiment: Partial<SentimentTelemetry> = msg.sentiment || {};
            const adaptive = calculateAdaptivePrompterSpeed(rawSentiment, room.activePrompterSpeed);

            const computedSentiment: SentimentTelemetry = {
              emotion: rawSentiment.emotion || 'confident',
              confidenceScore: rawSentiment.confidenceScore ?? 90,
              sentimentIndex: rawSentiment.sentimentIndex ?? 0.8,
              valence: rawSentiment.valence ?? 0.7,
              arousal: rawSentiment.arousal ?? 0.65,
              speechPaceModifier: adaptive.modifier,
              recommendedSpeed: adaptive.recommendedSpeed,
              faceTracked: rawSentiment.faceTracked !== false,
              timestamp: Date.now(),
              feedbackAdvice: adaptive.feedbackAdvice,
              rawSignals: rawSentiment.rawSignals || {
                smile: 75,
                browFurrow: 10,
                eyeContact: 90,
                headStability: 85,
                speechCadence: 140,
              },
            };

            room.currentSentiment = computedSentiment;

            // Broadcast sentiment & auto-adjusted speed to all session participants
            broadcastToRoom(room, {
              type: 'sentiment_broadcast',
              roomId,
              sentiment: computedSentiment,
              autoSpeed: adaptive.recommendedSpeed,
            });
            break;
          }

          case 'prompter_speed_sync': {
            const { speed, source = 'manual', reason } = msg;
            if (typeof speed === 'number') {
              room.activePrompterSpeed = speed;
              broadcastToRoom(
                room,
                {
                  type: 'prompter_speed_sync',
                  roomId,
                  speed,
                  source,
                  reason,
                },
                ws
              );
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.warn('[StudioWS] Parse message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentUserId && currentRoomId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          room.participants.delete(currentUserId);
          broadcastToRoom(room, {
            type: 'user_left',
            roomId: currentRoomId,
            userId: currentUserId,
            participantsCount: room.participants.size,
          });
        }
      }
    });

    ws.on('error', (err) => {
      console.warn('[StudioWS] Client connection error:', err);
    });
  });

  console.log('[iCALLOG StudioWS] Real-Time WebSocket Server initialized on /ws/studio');
  return wss;
}
