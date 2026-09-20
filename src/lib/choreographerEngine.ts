// ============================================================================
// iCALLOG 3D Dance & Emote Choreographer Engine
// Synthesizes custom procedural kinematics, bone rotation matrices, and AI-prompted motions
// ============================================================================

import * as THREE from 'three';

export type ArmChoreoStyle =
  | 'floss'
  | 'wave'
  | 'fist_pump'
  | 'karate_chop'
  | 'disco_point'
  | 'air_guitar'
  | 'cheer'
  | 'robot'
  | 'clap'
  | 'spin_wheel'
  | 'sword_slash';

export type LegChoreoStyle =
  | 'shuffle'
  | 'jump_bounce'
  | 'moonwalk_slide'
  | 'kick_swing'
  | 'running_man'
  | 'bhangra_kick'
  | 'wide_squat';

export type HeadBobStyle = 'bob' | 'look_around' | 'nod' | 'spin' | 'still';

export interface CustomDanceStep {
  id: string;
  name: string;
  hindiName?: string;
  genre: string;
  icon: string;
  description: string;
  tempoBpm: number; // 60 to 200
  hipSwayAmp: number; // 0.0 to 1.5
  hipBounceFreq: number; // 1.0 to 8.0
  torsoTwist: number; // 0.0 to 1.5
  chestPump: number; // 0.0 to 1.5
  headBobType: HeadBobStyle;
  lArmChoreo: ArmChoreoStyle;
  rArmChoreo: ArmChoreoStyle;
  legAction: LegChoreoStyle;
  isCustom?: boolean;
}

export const PRESET_DANCE_STEPS: CustomDanceStep[] = [
  {
    id: 'bollywood_thumka',
    name: 'Bollywood Thumka',
    hindiName: 'बॉलीवुड ठुमका व कमर लचक',
    genre: 'Bollywood Blockbuster',
    icon: '💃',
    description: 'High energetic hip sway with synchronized hand wave and chest rhythm.',
    tempoBpm: 128,
    hipSwayAmp: 1.2,
    hipBounceFreq: 4.2,
    torsoTwist: 0.8,
    chestPump: 0.6,
    headBobType: 'bob',
    lArmChoreo: 'wave',
    rArmChoreo: 'disco_point',
    legAction: 'shuffle',
  },
  {
    id: 'bhangra_bounce',
    name: 'Bhangra Shaan Step',
    hindiName: 'भांगड़ा कंधा व हाई नी बाउंस',
    genre: 'Folk Fusion',
    icon: '👳',
    description: 'Energetic Punjabi shoulder bounce with high-knee jumping kicks and raised cheer hands.',
    tempoBpm: 145,
    hipSwayAmp: 0.9,
    hipBounceFreq: 6.0,
    torsoTwist: 0.6,
    chestPump: 1.1,
    headBobType: 'nod',
    lArmChoreo: 'cheer',
    rArmChoreo: 'cheer',
    legAction: 'bhangra_kick',
  },
  {
    id: 'moonwalk_glide',
    name: 'MJ Moonwalk Slide',
    hindiName: 'माइकल जैक्सन मूनवॉक ग्लाइड',
    genre: 'Pop Legend',
    icon: '🕺',
    description: 'Smooth backwards heel-toe illusion glide with iconic hat-tilt pose.',
    tempoBpm: 116,
    hipSwayAmp: 0.4,
    hipBounceFreq: 2.5,
    torsoTwist: 0.3,
    chestPump: 0.4,
    headBobType: 'nod',
    lArmChoreo: 'fist_pump',
    rArmChoreo: 'disco_point',
    legAction: 'moonwalk_slide',
  },
  {
    id: 'cyber_rave_shuffle',
    name: 'Cyberpunk Neon Shuffle',
    hindiName: 'साइबरपंक नियॉन रेव शफल',
    genre: 'Cyberpunk Sci-Fi',
    icon: '⚡',
    description: 'Rapid 160 BPM electronic cutting shapes with glowing arm waves and cross-steps.',
    tempoBpm: 160,
    hipSwayAmp: 0.8,
    hipBounceFreq: 6.5,
    torsoTwist: 0.9,
    chestPump: 0.8,
    headBobType: 'bob',
    lArmChoreo: 'wave',
    rArmChoreo: 'wave',
    legAction: 'running_man',
  },
  {
    id: 'kpop_idol_point',
    name: 'K-Pop Idol Point & Turn',
    hindiName: 'के-पॉप आइडल पॉइंट व ट्वर्ल',
    genre: 'K-Pop Wave',
    icon: '✨',
    description: 'Razor-sharp synchronized finger pointing, side hip flick and dynamic head turns.',
    tempoBpm: 125,
    hipSwayAmp: 1.1,
    hipBounceFreq: 4.0,
    torsoTwist: 0.7,
    chestPump: 0.5,
    headBobType: 'look_around',
    lArmChoreo: 'disco_point',
    rArmChoreo: 'fist_pump',
    legAction: 'shuffle',
  },
  {
    id: 'matrix_neo_kata',
    name: 'Matrix Bullet Dodge & Kata',
    hindiName: 'मैट्रिक्स नियो कराटे व कॉम्बैट डांस',
    genre: 'Action Sci-Fi',
    icon: '⚔️',
    description: 'Slow-motion bullet time dodging torso lean with martial arts knife-hand strikes.',
    tempoBpm: 88,
    hipSwayAmp: 0.5,
    hipBounceFreq: 2.0,
    torsoTwist: 1.2,
    chestPump: 0.3,
    headBobType: 'still',
    lArmChoreo: 'karate_chop',
    rArmChoreo: 'karate_chop',
    legAction: 'wide_squat',
  },
  {
    id: 'hiphop_popping_wave',
    name: 'Hip-Hop Popping & Wave',
    hindiName: 'हिप-हॉप पॉपिंग व चेस्ट आइसोलेशन',
    genre: 'Street Dance',
    icon: '🧢',
    description: 'Electric arm isolation wave combined with snappy chest pop and robotic lock.',
    tempoBpm: 108,
    hipSwayAmp: 0.6,
    hipBounceFreq: 3.5,
    torsoTwist: 0.5,
    chestPump: 1.3,
    headBobType: 'nod',
    lArmChoreo: 'wave',
    rArmChoreo: 'robot',
    legAction: 'running_man',
  },
];

const LOCAL_STORAGE_KEY = 'icallog_custom_dance_steps_v1';

export function loadUserCustomDances(): CustomDanceStep[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveUserCustomDances(dances: CustomDanceStep[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dances));
  } catch (e) {
    console.error('Failed to save custom dances', e);
  }
}

// AI Synthesizer: Translates natural language prompt into parametric kinematics
export function synthesizeMotionFromPrompt(prompt: string): CustomDanceStep {
  const p = prompt.toLowerCase();
  const id = `custom_${Date.now()}`;
  let name = 'Custom AI Choreography';
  let hindiName = 'कस्टम AI डांस स्टेप';
  let icon = '🕺';
  let genre = 'Custom Studio';
  let tempoBpm = 120;
  let hipSwayAmp = 0.8;
  let hipBounceFreq = 4.0;
  let torsoTwist = 0.6;
  let chestPump = 0.5;
  let headBobType: HeadBobStyle = 'bob';
  let lArmChoreo: ArmChoreoStyle = 'wave';
  let rArmChoreo: ArmChoreoStyle = 'disco_point';
  let legAction: LegChoreoStyle = 'shuffle';

  if (p.includes('bhangra') || p.includes('punjabi') || p.includes('dhol')) {
    name = 'Punjabi Bhangra Step';
    hindiName = 'पंजाबी भांगड़ा डांस स्टेप';
    icon = '👳';
    genre = 'Bhangra Folk';
    tempoBpm = 148;
    hipSwayAmp = 1.0;
    hipBounceFreq = 5.5;
    torsoTwist = 0.7;
    chestPump = 1.2;
    headBobType = 'nod';
    lArmChoreo = 'cheer';
    rArmChoreo = 'cheer';
    legAction = 'bhangra_kick';
  } else if (p.includes('bollywood') || p.includes('desi') || p.includes('thumka') || p.includes('latka')) {
    name = 'Bollywood Dramatic Thumka';
    hindiName = 'बॉलीवुड नाटकीय ठुमका';
    icon = '💃';
    genre = 'Bollywood';
    tempoBpm = 132;
    hipSwayAmp = 1.4;
    hipBounceFreq = 4.0;
    torsoTwist = 1.0;
    chestPump = 0.8;
    headBobType = 'bob';
    lArmChoreo = 'wave';
    rArmChoreo = 'disco_point';
    legAction = 'shuffle';
  } else if (p.includes('moonwalk') || p.includes('michael') || p.includes('jackson') || p.includes('glide')) {
    name = 'MJ Smooth Moonwalk';
    hindiName = 'स्मूथ मूनवॉक ग्लाइड';
    icon = '🕺';
    genre = 'Pop Legend';
    tempoBpm = 114;
    hipSwayAmp = 0.4;
    hipBounceFreq = 2.8;
    torsoTwist = 0.4;
    chestPump = 0.5;
    headBobType = 'nod';
    lArmChoreo = 'fist_pump';
    rArmChoreo = 'disco_point';
    legAction = 'moonwalk_slide';
  } else if (p.includes('cyber') || p.includes('robot') || p.includes('tech') || p.includes('lock')) {
    name = 'Cybernetic Mecha Pop';
    hindiName = 'साइबरनेटिक मेका पॉप व लॉक';
    icon = '🤖';
    genre = 'Cyberpunk Sci-Fi';
    tempoBpm = 120;
    hipSwayAmp = 0.3;
    hipBounceFreq = 3.0;
    torsoTwist = 0.2;
    chestPump = 1.0;
    headBobType = 'spin';
    lArmChoreo = 'robot';
    rArmChoreo = 'robot';
    legAction = 'running_man';
  } else if (p.includes('combat') || p.includes('karate') || p.includes('ninja') || p.includes('fight') || p.includes('martial')) {
    name = 'Ninja Shadow Kata Dance';
    hindiName = 'निंजा शैडो काता व किक स्टेप';
    icon = '⚔️';
    genre = 'Martial Arts';
    tempoBpm = 95;
    hipSwayAmp = 0.6;
    hipBounceFreq = 2.4;
    torsoTwist = 1.3;
    chestPump = 0.4;
    headBobType = 'look_around';
    lArmChoreo = 'karate_chop';
    rArmChoreo = 'karate_chop';
    legAction = 'kick_swing';
  } else if (p.includes('garba') || p.includes('dandiya') || p.includes('twirl') || p.includes('spin')) {
    name = 'Garba Rapid 360 Spin';
    hindiName = 'गरबा 360 डिग्री ताली व स्पिन';
    icon = '🪘';
    genre = 'Traditional Folk';
    tempoBpm = 140;
    hipSwayAmp = 1.1;
    hipBounceFreq = 4.8;
    torsoTwist = 1.2;
    chestPump = 0.7;
    headBobType = 'spin';
    lArmChoreo = 'clap';
    rArmChoreo = 'clap';
    legAction = 'jump_bounce';
  } else if (p.includes('kpop') || p.includes('idol') || p.includes('bts') || p.includes('blackpink')) {
    name = 'K-Pop Signature Point';
    hindiName = 'के-पॉप सिग्नेचर पॉइंट डांस';
    icon = '✨';
    genre = 'K-Pop';
    tempoBpm = 128;
    hipSwayAmp = 1.0;
    hipBounceFreq = 4.2;
    torsoTwist = 0.7;
    chestPump = 0.6;
    headBobType = 'look_around';
    lArmChoreo = 'disco_point';
    rArmChoreo = 'fist_pump';
    legAction = 'shuffle';
  } else {
    // Generative procedural adaptation
    name = prompt.slice(0, 24).trim() || 'Custom Motion Step';
    hindiName = 'कस्टम जनरेटेड स्टेप';
    tempoBpm = 110 + Math.floor(Math.random() * 40);
    hipSwayAmp = 0.6 + Math.random() * 0.6;
    hipBounceFreq = 3.0 + Math.random() * 3.0;
    torsoTwist = 0.4 + Math.random() * 0.6;
    chestPump = 0.4 + Math.random() * 0.6;
    lArmChoreo = 'wave';
    rArmChoreo = 'disco_point';
    legAction = 'shuffle';
  }

  return {
    id,
    name,
    hindiName,
    genre,
    icon,
    description: `Synthesized motion derived from: "${prompt.slice(0, 48)}"`,
    tempoBpm,
    hipSwayAmp,
    hipBounceFreq,
    torsoTwist,
    chestPump,
    headBobType,
    lArmChoreo,
    rArmChoreo,
    legAction,
    isCustom: true,
  };
}

// ============================================================================
// Real-Time Procedural Armature Kinematics Solver
// Drives Three.js Skeleton Bones with mathematical smoothness
// ============================================================================

export function applyCustomDanceKinematics(
  time: number,
  step: CustomDanceStep,
  bones: Record<string, THREE.Bone>
) {
  const { root, spine, chest, neck, head, lShoulder, lArm, lHand, rShoulder, rArm, rHand, lHip, lKnee, lFoot, rHip, rKnee, rFoot } = bones;
  if (!root || !spine || !chest || !head || !lArm || !rArm || !lHip || !rHip) return;

  const freq = (step.tempoBpm / 60) * Math.PI; // angular velocity for rhythmic beats
  const beatTime = time * (freq * 0.5);

  // 1. Root & Hip Dynamics
  const sway = Math.sin(beatTime * 2.0) * step.hipSwayAmp;
  const bounce = Math.abs(Math.sin(beatTime * step.hipBounceFreq * 0.5)) * 0.12 * step.chestPump;
  root.position.x = sway * 0.15;
  root.position.y = 1.0 + bounce;
  root.rotation.z = -sway * 0.12;

  // 2. Spine & Torso Twist
  spine.rotation.z = sway * 0.18;
  spine.rotation.y = Math.cos(beatTime * 2.0) * 0.3 * step.torsoTwist;
  spine.rotation.x = Math.sin(beatTime * 1.5) * 0.1 * step.chestPump;

  // 3. Chest Pump
  chest.rotation.x = -0.1 + Math.sin(beatTime * 4.0) * 0.15 * step.chestPump;
  chest.rotation.y = Math.sin(beatTime * 2.0) * 0.2 * step.torsoTwist;

  // 4. Head Bob / Emote
  switch (step.headBobType) {
    case 'bob':
      head.rotation.x = Math.sin(beatTime * 4.0) * 0.25;
      head.rotation.y = Math.sin(beatTime * 2.0) * 0.2;
      break;
    case 'look_around':
      head.rotation.y = Math.sin(beatTime * 1.5) * 0.5;
      head.rotation.z = Math.cos(beatTime * 2.0) * 0.15;
      break;
    case 'nod':
      head.rotation.x = Math.abs(Math.sin(beatTime * 3.0)) * 0.35;
      break;
    case 'spin':
      head.rotation.y = (beatTime * 3.0) % (Math.PI * 2);
      break;
    case 'still':
    default:
      head.rotation.set(0, 0, 0);
      break;
  }

  // 5. Left Arm Choreography
  applyArmStyle(beatTime, step.lArmChoreo, lArm, lShoulder, lHand, true);

  // 6. Right Arm Choreography
  applyArmStyle(beatTime, step.rArmChoreo, rArm, rShoulder, rHand, false);

  // 7. Leg & Footwork Choreography
  applyLegStyle(beatTime, step.legAction, lHip, lKnee, lFoot, rHip, rKnee, rFoot, sway);
}

function applyArmStyle(
  t: number,
  style: ArmChoreoStyle,
  arm: THREE.Bone,
  shoulder?: THREE.Bone,
  hand?: THREE.Bone,
  isLeft: boolean = true
) {
  const sign = isLeft ? 1 : -1;
  switch (style) {
    case 'wave':
      arm.rotation.x = Math.sin(t * 3.0 + (isLeft ? 0 : Math.PI)) * 0.8 + 0.3;
      arm.rotation.z = sign * (0.8 + Math.cos(t * 3.0) * 0.4);
      arm.rotation.y = Math.sin(t * 2.0) * 0.4;
      break;
    case 'fist_pump':
      arm.rotation.x = 2.2 + Math.sin(t * 6.0) * 0.5;
      arm.rotation.z = sign * 0.4;
      arm.rotation.y = 0;
      break;
    case 'cheer':
      arm.rotation.x = 2.7 + Math.sin(t * 4.0) * 0.2;
      arm.rotation.z = sign * (0.6 + Math.cos(t * 4.0) * 0.2);
      break;
    case 'disco_point':
      arm.rotation.x = 1.4 + Math.sin(t * 3.0) * 0.7;
      arm.rotation.z = sign * (1.2 + Math.cos(t * 3.0) * 0.3);
      break;
    case 'karate_chop':
      arm.rotation.x = 1.6 + Math.sin(t * 5.0) * 0.6;
      arm.rotation.z = sign * 0.3;
      arm.rotation.y = Math.cos(t * 5.0) * 0.4;
      break;
    case 'clap':
      arm.rotation.x = 1.2;
      arm.rotation.z = sign * (0.2 + Math.abs(Math.sin(t * 5.0)) * 0.3);
      arm.rotation.y = sign * 0.6;
      break;
    case 'robot':
      const step = Math.floor(t * 2.5) % 4;
      arm.rotation.x = step === 0 || step === 1 ? 1.57 : 0.2;
      arm.rotation.z = sign * (step === 2 || step === 3 ? 1.57 : 0.3);
      arm.rotation.y = 0;
      break;
    case 'floss':
    default:
      arm.rotation.x = Math.sin(t * 4.0 + (isLeft ? 0.5 : -0.5)) * 1.3;
      arm.rotation.z = sign * (0.4 + Math.cos(t * 4.0) * 0.5);
      break;
  }
}

function applyLegStyle(
  t: number,
  style: LegChoreoStyle,
  lHip: THREE.Bone,
  lKnee?: THREE.Bone,
  lFoot?: THREE.Bone,
  rHip?: THREE.Bone,
  rKnee?: THREE.Bone,
  rFoot?: THREE.Bone,
  sway: number = 0
) {
  if (!rHip) return;
  switch (style) {
    case 'bhangra_kick':
      lHip.rotation.x = Math.sin(t * 4.0) * 0.9;
      rHip.rotation.x = -Math.sin(t * 4.0) * 0.9;
      lHip.rotation.z = -sway * 0.2 + 0.2;
      rHip.rotation.z = -sway * 0.2 - 0.2;
      break;
    case 'moonwalk_slide':
      lHip.rotation.x = Math.sin(t * 2.0) * 0.5;
      rHip.rotation.x = -Math.sin(t * 2.0) * 0.5;
      lHip.rotation.z = 0.05;
      rHip.rotation.z = -0.05;
      break;
    case 'jump_bounce':
      lHip.rotation.x = Math.abs(Math.sin(t * 4.0)) * 0.3;
      rHip.rotation.x = Math.abs(Math.sin(t * 4.0)) * 0.3;
      lHip.rotation.z = -0.2;
      rHip.rotation.z = 0.2;
      break;
    case 'running_man':
      lHip.rotation.x = Math.sin(t * 6.0) * 0.8;
      rHip.rotation.x = -Math.sin(t * 6.0) * 0.8;
      break;
    case 'wide_squat':
      lHip.rotation.z = 0.5;
      rHip.rotation.z = -0.5;
      lHip.rotation.x = 0.3;
      rHip.rotation.x = 0.3;
      break;
    case 'shuffle':
    default:
      lHip.rotation.x = Math.sin(t * 3.0) * 0.4;
      rHip.rotation.x = -Math.sin(t * 3.0) * 0.4;
      lHip.rotation.z = -sway * 0.15;
      rHip.rotation.z = -sway * 0.15;
      break;
  }
}
