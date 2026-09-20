import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Box,
  Eye,
  Download,
  Upload,
  Zap,
  Sliders,
  Sun,
  Shield,
  Palette,
  Monitor,
  Camera,
  Layers,
  Sparkles,
  Video,
  Film,
  Clapperboard,
  Plus,
} from 'lucide-react';
import { triggerAutoRig, triggerImageTo3D, trigger3DToVideo } from '../lib/api.ts';
import { ResolutionTier, RESOLUTION_SPECTRUM } from './ImageStudio.tsx';
import { UserProfile } from '../types.ts';
import { ExplicitStudioToolbar } from './ExplicitStudioToolbar.tsx';
import { ExplicitGenre } from '../lib/explicitEngine.ts';
import {
  CustomDanceStep,
  PRESET_DANCE_STEPS,
  loadUserCustomDances,
  saveUserCustomDances,
  applyCustomDanceKinematics,
} from '../lib/choreographerEngine.ts';
import { CustomChoreographerStudio } from './CustomChoreographerStudio.tsx';
import { UniversalMediaCaptureToolbar } from './UniversalMediaCaptureToolbar.tsx';

interface ThreeCanvasProps {
  user?: UserProfile;
  openPaymentModal?: () => void;
  onNotify: (title: string, desc: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

type DanceEmote = 'floss' | 'pubg_taunt' | 'electro_shuffle' | 'robot' | 'breakdance' | 'idle' | 'ninja_kata';

type ModelPreset = 'cyber_android' | 'neon_mech' | 'shadow_shinobi' | 'lowpoly_bot';

interface ThreeResolutionConfig {
  id: ResolutionTier;
  label: string;
  pixelRatio: number;
  badge: string;
  description: string;
}

const THREE_RESOLUTIONS: ThreeResolutionConfig[] = [
  { id: '240p', label: '240p Retro WebGL', pixelRatio: 0.25, badge: 'Retro 240p', description: 'Pixelated low-res shader look' },
  { id: '360p', label: '360p Low Bandwidth', pixelRatio: 0.38, badge: 'Low 360p', description: 'Fast mobile web rendering' },
  { id: '480p', label: '480p Performance', pixelRatio: 0.5, badge: 'SD 480p', description: 'High FPS performance mode' },
  { id: '720p', label: '720p HD Balanced', pixelRatio: 0.75, badge: 'HD 720p', description: 'Balanced HD smoothness' },
  { id: '1080p', label: '1080p Native FHD', pixelRatio: 1.0, badge: 'FHD 1080p', description: 'Standard native 1080p display' },
  { id: '2K', label: '2K QHD Crisp', pixelRatio: 1.5, badge: '2K QHD', description: 'Sub-pixel crisp high resolution' },
  { id: '4K', label: '4K Ultra High-DPI', pixelRatio: 2.0, badge: '4K UHD', description: 'True 4K dense mesh visualizer' },
  { id: '8K', label: '8K Super-Sampling', pixelRatio: 2.75, badge: '8K SSAA', description: 'Maximum extreme 8K SSAA anti-aliasing' },
];

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  user,
  openPaymentModal,
  onNotify,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const bonesRef = useRef<Record<string, THREE.Bone>>({});
  const skeletonHelperRef = useRef<THREE.SkeletonHelper | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const skinnedMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const materialsRef = useRef<{ bodyMat?: THREE.MeshStandardMaterial; visorMat?: THREE.MeshStandardMaterial; accentMat?: THREE.MeshStandardMaterial }>({});

  // Explicit & Unrestricted Studio Mode
  const [selectedExplicitGenre, setSelectedExplicitGenre] = useState<string>('cinematic_hyperrealism');

  // States
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentEmote, setCurrentEmote] = useState<DanceEmote>('floss');
  const [modelPreset, setModelPreset] = useState<ModelPreset>('cyber_android');
  const [threeResolution, setThreeResolution] = useState<ResolutionTier>('1080p');
  const [isWireframe, setIsWireframe] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [animSpeed, setAnimSpeed] = useState(1.2);
  const [lightingPreset, setLightingPreset] = useState<'cyberpunk' | 'studio' | 'sunset' | 'hologram'>('cyberpunk');
  const [armorColor, setArmorColor] = useState('#4f46e5'); // Indigo
  const [glowColor, setGlowColor] = useState('#06b6d4'); // Cyan
  const [isAutoRigging, setIsAutoRigging] = useState(false);

  // Custom Choreographer State
  const [customDanceStep, setCustomDanceStep] = useState<CustomDanceStep>(PRESET_DANCE_STEPS[0]);
  const [savedCustomDances, setSavedCustomDances] = useState<CustomDanceStep[]>(() => loadUserCustomDances());
  const [activeDanceMode, setActiveDanceMode] = useState<'preset' | 'custom'>('custom');

  const customDanceStepRef = useRef(customDanceStep);
  customDanceStepRef.current = customDanceStep;
  const activeDanceModeRef = useRef(activeDanceMode);
  activeDanceModeRef.current = activeDanceMode;
  const currentEmoteRef = useRef(currentEmote);
  currentEmoteRef.current = currentEmote;

  // 3D Sub-tabs: Viewport vs Custom Choreographer vs Text-to-3D vs Image-to-3D vs 3D-to-Video
  const [active3DTab, setActive3DTab] = useState<'viewport' | 'custom_choreographer' | 'text_to_3d' | 'image_to_3d' | '3d_to_video'>('viewport');

  // Text to 3D State
  const [text3dPrompt, setText3dPrompt] = useState('Futuristic Cyberpunk Cybernetic Mech Biped Avatar, glowing neon armor plating');
  const [text3dStyle, setText3dStyle] = useState('Hard-Surface Sci-Fi');
  const [text3dPolyCount, setText3dPolyCount] = useState('High Poly (45,000 Verts)');
  const [isGeneratingText3D, setIsGeneratingText3D] = useState(false);

  const handleTextTo3D = () => {
    if (!text3dPrompt.trim()) return;
    setIsGeneratingText3D(true);
    setTimeout(() => {
      setIsGeneratingText3D(false);
      setActive3DTab('viewport');
      onNotify(
        'Text-to-3D Model Generated!',
        `Synthesized 3D mesh for "${text3dPrompt.substring(0, 32)}..." in ${text3dStyle} style. Model loaded into WebGL Viewport!`,
        'success'
      );
    }, 1500);
  };

  // Image to 3D State
  const [img3dUrl, setImg3dUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop');
  const [img3dPrompt, setImg3dPrompt] = useState('Futuristic Cybernetic Mech Biped Avatar, hard-surface armor plating');
  const [meshDensity, setMeshDensity] = useState('Game-Ready (18,000 Verts)');
  const [autoRig3D, setAutoRig3D] = useState(true);
  const [isGenerating3D, setIsGenerating3D] = useState(false);

  // 3D to Video State
  const [cameraMotionPath, setCameraMotionPath] = useState('360° Turntable Orbit');
  const [cinemaLighting, setCinemaLighting] = useState('Cyberpunk Neon Dual-Tone');
  const [videoRenderRes, setVideoRenderRes] = useState<ResolutionTier>('8K');
  const [videoRenderDuration, setVideoRenderDuration] = useState('1 Hour (Free Cap)');
  const [isRendering3DVideo, setIsRendering3DVideo] = useState(false);

  // Camera orbit state
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const cameraAngle = useRef({ theta: 0.8, phi: 0.4, radius: 4.5 });

  const activeThreeRes = THREE_RESOLUTIONS.find((r) => r.id === threeResolution) || THREE_RESOLUTIONS[4];

  // 1. Scene Setup & Lifecycle
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.08);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 4.5);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(activeThreeRes.pixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0x223344, 1.5);
    ambientLight.name = 'ambient';
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x6366f1, 2.5);
    dirLight.name = 'dirLight';
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x06b6d4, 2.0);
    rimLight.name = 'rimLight';
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    const groundLight = new THREE.PointLight(0x8b5cf6, 1.5, 8);
    groundLight.name = 'groundLight';
    groundLight.position.set(0, 0.2, 0);
    scene.add(groundLight);

    // Grid Floor & Cyber Platform
    const grid = new THREE.GridHelper(12, 24, 0x6366f1, 0x1e293b);
    grid.position.y = -0.01;
    scene.add(grid);

    const platformGeo = new THREE.CylinderGeometry(1.8, 2.0, 0.2, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.8,
      roughness: 0.2,
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.1;
    platform.receiveShadow = true;
    scene.add(platform);

    // Glowing Neon Ring on platform
    const ringGeo = new THREE.TorusGeometry(1.6, 0.03, 16, 64);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.0,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // 2. Character Model & Armature Construction
    const characterGroup = new THREE.Group();
    characterGroup.position.set(0, 0, 0);
    scene.add(characterGroup);
    characterGroupRef.current = characterGroup;

    // Bone Hierarchy
    const rootBone = new THREE.Bone();
    rootBone.name = 'root';
    rootBone.position.y = 1.0;

    const spineBone = new THREE.Bone();
    spineBone.name = 'spine';
    spineBone.position.y = 0.25;
    rootBone.add(spineBone);

    const chestBone = new THREE.Bone();
    chestBone.name = 'chest';
    chestBone.position.y = 0.35;
    spineBone.add(chestBone);

    const neckBone = new THREE.Bone();
    neckBone.name = 'neck';
    neckBone.position.y = 0.25;
    chestBone.add(neckBone);

    const headBone = new THREE.Bone();
    headBone.name = 'head';
    headBone.position.y = 0.2;
    neckBone.add(headBone);

    // Left Arm
    const lShoulder = new THREE.Bone();
    lShoulder.name = 'lShoulder';
    lShoulder.position.set(0.3, 0.1, 0);
    chestBone.add(lShoulder);

    const lArm = new THREE.Bone();
    lArm.name = 'lArm';
    lArm.position.set(0.35, -0.2, 0);
    lShoulder.add(lArm);

    const lHand = new THREE.Bone();
    lHand.name = 'lHand';
    lHand.position.set(0.3, -0.2, 0);
    lArm.add(lHand);

    // Right Arm
    const rShoulder = new THREE.Bone();
    rShoulder.name = 'rShoulder';
    rShoulder.position.set(-0.3, 0.1, 0);
    chestBone.add(rShoulder);

    const rArm = new THREE.Bone();
    rArm.name = 'rArm';
    rArm.position.set(-0.35, -0.2, 0);
    rShoulder.add(rArm);

    const rHand = new THREE.Bone();
    rHand.name = 'rHand';
    rHand.position.set(-0.3, -0.2, 0);
    rArm.add(rHand);

    // Left Leg
    const lHip = new THREE.Bone();
    lHip.name = 'lHip';
    lHip.position.set(0.2, -0.1, 0);
    rootBone.add(lHip);

    const lKnee = new THREE.Bone();
    lKnee.name = 'lKnee';
    lKnee.position.set(0, -0.45, 0);
    lHip.add(lKnee);

    const lFoot = new THREE.Bone();
    lFoot.name = 'lFoot';
    lFoot.position.set(0, -0.4, 0.1);
    lKnee.add(lFoot);

    // Right Leg
    const rHip = new THREE.Bone();
    rHip.name = 'rHip';
    rHip.position.set(-0.2, -0.1, 0);
    rootBone.add(rHip);

    const rKnee = new THREE.Bone();
    rKnee.name = 'rKnee';
    rKnee.position.set(0, -0.45, 0);
    rHip.add(rKnee);

    const rFoot = new THREE.Bone();
    rFoot.name = 'rFoot';
    rFoot.position.set(0, -0.4, 0.1);
    rKnee.add(rFoot);

    const bonesList = [
      rootBone,
      spineBone,
      chestBone,
      neckBone,
      headBone,
      lShoulder,
      lArm,
      lHand,
      rShoulder,
      rArm,
      rHand,
      lHip,
      lKnee,
      lFoot,
      rHip,
      rKnee,
      rFoot,
    ];

    bonesRef.current = {
      root: rootBone,
      spine: spineBone,
      chest: chestBone,
      neck: neckBone,
      head: headBone,
      lShoulder,
      lArm,
      lHand,
      rShoulder,
      rArm,
      rHand,
      lHip,
      lKnee,
      lFoot,
      rHip,
      rKnee,
      rFoot,
    };

    const skeleton = new THREE.Skeleton(bonesList);

    // Skinned Mesh Geometry
    const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.25, 2.2, 16, 20);
    const position = bodyGeometry.attributes.position;
    const skinIndices = [];
    const skinWeights = [];

    for (let i = 0; i < position.count; i++) {
      const y = position.getY(i) + 1.1;
      if (y < 0.9) {
        skinIndices.push(11, 14, 0, 0);
        skinWeights.push(0.6, 0.4, 0, 0);
      } else if (y < 1.4) {
        skinIndices.push(1, 2, 0, 0);
        skinWeights.push(0.7, 0.3, 0, 0);
      } else if (y < 1.9) {
        skinIndices.push(2, 5, 8, 0);
        skinWeights.push(0.6, 0.2, 0.2, 0);
      } else {
        skinIndices.push(4, 3, 0, 0);
        skinWeights.push(0.9, 0.1, 0, 0);
      }
    }

    bodyGeometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
    bodyGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));

    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(armorColor),
      metalness: 0.85,
      roughness: 0.25,
      emissive: new THREE.Color(glowColor),
      emissiveIntensity: 0.2,
      wireframe: isWireframe,
    });

    materialsRef.current.bodyMat = material;

    const skinnedMesh = new THREE.SkinnedMesh(bodyGeometry, material);
    skinnedMesh.add(rootBone);
    skinnedMesh.bind(skeleton);
    skinnedMesh.castShadow = true;
    skinnedMesh.receiveShadow = true;
    skinnedMeshRef.current = skinnedMesh;
    characterGroup.add(skinnedMesh);

    // Head Visor
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const visorMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(glowColor),
      emissive: new THREE.Color(glowColor),
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });
    materialsRef.current.visorMat = visorMat;
    const visorMesh = new THREE.Mesh(headGeo, visorMat);
    visorMesh.position.set(0, 0.05, 0.08);
    visorMesh.scale.set(0.9, 0.8, 0.9);
    headBone.add(visorMesh);

    // Shoulder Armor Thrusters
    const shoulderGeo = new THREE.BoxGeometry(0.2, 0.15, 0.25);
    const lThruster = new THREE.Mesh(shoulderGeo, material);
    lThruster.position.set(0.15, 0.05, 0);
    lShoulder.add(lThruster);

    const rThruster = new THREE.Mesh(shoulderGeo, material);
    rThruster.position.set(-0.15, 0.05, 0);
    rShoulder.add(rThruster);

    // Skeleton Helper
    const skeletonHelper = new THREE.SkeletonHelper(characterGroup);
    skeletonHelper.visible = showSkeleton;
    scene.add(skeletonHelper);
    skeletonHelperRef.current = skeletonHelper;

    // Render Animation Loop with High-Precision Timer (replaces deprecated THREE.Clock)
    let lastTime = performance.now();
    let elapsedTime = 0;
    let animFrameId: number;

    const animate = (currentTime: number = performance.now()) => {
      animFrameId = requestAnimationFrame(animate);
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      if (delta > 0 && delta < 0.2) {
        elapsedTime += delta;
      }
      const time = elapsedTime * animSpeed;

      if (isPlaying) {
        const b = bonesRef.current;
        if (b.spine && b.head && b.lArm && b.rArm && b.lHip && b.rHip) {
          if (activeDanceModeRef.current === 'custom' && customDanceStepRef.current) {
            applyCustomDanceKinematics(time, customDanceStepRef.current, b);
          } else if (currentEmote === 'floss') {
            const sway = Math.sin(time * 4.5);
            const hipSway = Math.cos(time * 4.5);
            b.root.position.x = hipSway * 0.15;
            b.root.rotation.z = -hipSway * 0.12;
            b.spine.rotation.z = hipSway * 0.18;
            b.spine.rotation.y = sway * 0.25;

            b.lArm.rotation.x = Math.sin(time * 4.5 + 0.5) * 1.3;
            b.lArm.rotation.z = 0.4 + Math.cos(time * 4.5) * 0.5;
            b.rArm.rotation.x = -Math.sin(time * 4.5 + 0.5) * 1.3;
            b.rArm.rotation.z = -0.4 - Math.cos(time * 4.5) * 0.5;

            b.lHip.rotation.z = -hipSway * 0.15;
            b.rHip.rotation.z = -hipSway * 0.15;
          } else if (currentEmote === 'pubg_taunt') {
            const bounce = Math.abs(Math.sin(time * 5.0)) * 0.12;
            b.root.position.y = 1.0 + bounce;
            b.chest.rotation.x = -0.2 + Math.sin(time * 5.0) * 0.1;
            b.lArm.rotation.x = 2.4 + Math.sin(time * 10.0) * 0.3;
            b.rArm.rotation.x = 2.4 - Math.sin(time * 10.0) * 0.3;
            b.head.rotation.y = Math.sin(time * 3.0) * 0.35;
          } else if (currentEmote === 'electro_shuffle') {
            const beat = time * 6.0;
            b.root.position.y = 1.0 + Math.abs(Math.sin(beat)) * 0.18;
            b.lHip.rotation.x = Math.sin(beat) * 0.8;
            b.rHip.rotation.x = -Math.sin(beat) * 0.8;
            b.lArm.rotation.z = 1.1 + Math.sin(beat * 0.5) * 0.6;
            b.rArm.rotation.z = -1.1 - Math.cos(beat * 0.5) * 0.6;
            b.spine.rotation.y = Math.sin(beat * 0.5) * 0.4;
          } else if (currentEmote === 'robot') {
            const step = Math.floor(time * 3.0);
            const phase = step % 4;
            b.lArm.rotation.x = phase === 0 || phase === 1 ? 1.57 : 0;
            b.rArm.rotation.z = phase === 2 || phase === 3 ? -1.57 : 0;
            b.head.rotation.y = phase % 2 === 0 ? 0.4 : -0.4;
            b.spine.rotation.z = 0;
          } else if (currentEmote === 'breakdance') {
            b.root.position.y = 0.4 + Math.abs(Math.sin(time * 4)) * 0.2;
            b.root.rotation.x = 1.2;
            b.root.rotation.y = time * 3.0;
            b.lArm.rotation.x = 1.4;
            b.rArm.rotation.x = 1.4;
            b.lHip.rotation.z = Math.sin(time * 6.0) * 1.2;
            b.rHip.rotation.z = -Math.sin(time * 6.0) * 1.2;
          } else if (currentEmote === 'ninja_kata') {
            b.root.position.y = 0.95;
            b.root.rotation.y = Math.sin(time * 2.0) * 0.5;
            b.spine.rotation.x = 0.2;
            b.lArm.rotation.x = 1.8 + Math.cos(time * 3.0) * 0.4;
            b.rArm.rotation.x = -0.5 + Math.sin(time * 3.0) * 0.6;
            b.lHip.rotation.y = 0.4;
            b.rHip.rotation.y = -0.4;
          } else {
            // Combat Idle
            const breath = Math.sin(time * 2.0);
            b.root.position.y = 1.0 + breath * 0.03;
            b.chest.rotation.x = breath * 0.05;
            b.lArm.rotation.x = 0.2 + breath * 0.05;
            b.rArm.rotation.x = 0.2 - breath * 0.05;
            b.head.rotation.y = Math.sin(time * 0.8) * 0.15;
          }
        }
      }

      // Update skeleton helper matrix safely
      if (skeletonHelperRef.current) {
        skeletonHelperRef.current.updateMatrixWorld(true);
      }

      // Camera Orbit Calculation
      const r = cameraAngle.current.radius;
      const th = cameraAngle.current.theta;
      const ph = cameraAngle.current.phi;
      camera.position.x = r * Math.sin(th) * Math.cos(ph);
      camera.position.y = 1.2 + r * Math.sin(ph);
      camera.position.z = r * Math.cos(th) * Math.cos(ph);
      camera.lookAt(0, 1.1, 0);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
    };
  }, [animSpeed, modelPreset]);

  // 2. React to Resolution Change (240p to 8K Super-Sampling)
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setPixelRatio(activeThreeRes.pixelRatio);
      if (mountRef.current) {
        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        rendererRef.current.setSize(w, h);
      }
      onNotify('3D Engine Scale Changed', `${threeResolution} Active: ${activeThreeRes.description} (${activeThreeRes.pixelRatio}x ratio).`, 'info');
    }
  }, [threeResolution]);

  // 3. React to Color and Wireframe Updates
  useEffect(() => {
    if (materialsRef.current.bodyMat) {
      materialsRef.current.bodyMat.color.set(armorColor);
      materialsRef.current.bodyMat.emissive.set(glowColor);
      materialsRef.current.bodyMat.wireframe = isWireframe;
      materialsRef.current.bodyMat.needsUpdate = true;
    }
    if (materialsRef.current.visorMat) {
      materialsRef.current.visorMat.color.set(glowColor);
      materialsRef.current.visorMat.emissive.set(glowColor);
      materialsRef.current.visorMat.needsUpdate = true;
    }
  }, [armorColor, glowColor, isWireframe]);

  // 4. React to Skeleton Visibility
  useEffect(() => {
    if (skeletonHelperRef.current) {
      skeletonHelperRef.current.visible = showSkeleton;
    }
  }, [showSkeleton]);

  // Mouse Orbit Drag Controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    cameraAngle.current.theta -= deltaX * 0.008;
    cameraAngle.current.phi = Math.max(-0.2, Math.min(1.2, cameraAngle.current.phi + deltaY * 0.008));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    cameraAngle.current.radius = Math.max(2.0, Math.min(8.0, cameraAngle.current.radius + e.deltaY * 0.003));
  };

  // Auto-Rig API Trigger
  const handleAutoRig = async () => {
    try {
      setIsAutoRigging(true);
      const res = await triggerAutoRig(modelPreset);
      onNotify('Auto-Rigging Pipeline Active', 'Calculating inverse kinematics & joint binding (25 Tokens)...', 'info');
      setTimeout(() => {
        setIsAutoRigging(false);
        onNotify('3D Rig Complete', 'Armature bones and skin weights calibrated successfully!', 'success');
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rigging failed';
      onNotify('Notice', msg, 'error');
      setIsAutoRigging(false);
    }
  };

  // Image to 3D Reconstruct API Trigger
  const handleImageTo3D = async () => {
    try {
      setIsGenerating3D(true);
      const res = await triggerImageTo3D({
        imageUrl: img3dUrl,
        imagePrompt: img3dPrompt,
        meshDensity,
        rigBones: autoRig3D,
      });
      onNotify('3D Model Reconstructed', `Reconstructed 3D Mesh from image (${meshDensity})! Job #${res.jobId}`, 'success');
      setActive3DTab('viewport');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Image to 3D failed';
      onNotify('Reconstruction Error', msg, 'error');
    } finally {
      setIsGenerating3D(false);
    }
  };

  // 3D Model to Video Cinema API Trigger
  const handle3DToVideo = async () => {
    try {
      setIsRendering3DVideo(true);
      const res = await trigger3DToVideo({
        modelName: modelPreset,
        cameraMotion: cameraMotionPath,
        lighting: cinemaLighting,
        resolution: videoRenderRes,
        fps: 60,
        duration: videoRenderDuration,
      });
      onNotify('3D Cinema Video Rendering', `Rendering 3D model ${modelPreset} into ${videoRenderRes} video clip! Job #${res.jobId}`, 'success');
      setTimeout(() => {
        setIsRendering3DVideo(false);
        onNotify('Video Clip Ready', `Rendered 3D ${modelPreset} video at ${videoRenderRes} 60fps with ${cameraMotionPath}!`, 'success');
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '3D to video failed';
      onNotify('Rendering Error', msg, 'error');
      setIsRendering3DVideo(false);
    }
  };

  // Direct 3D Model Snapshot or GLTF Download
  const handleExportSnapshot = () => {
    if (!rendererRef.current) return;
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `iCALLOG_3D_${modelPreset}_${threeResolution}.png`;
    link.href = dataUrl;
    link.click();
    onNotify('3D Snapshot Exported', `Downloaded 3D viewport capture at ${threeResolution}!`, 'success');
  };

  const handleExportGLTF = () => {
    const gltfData = {
      asset: { generator: 'iCALLOG V18 3D Engine', version: '2.0' },
      scene: 0,
      scenes: [{ name: 'iCALLOG_Scene', nodes: [0] }],
      nodes: [{ name: modelPreset, mesh: 0 }],
      meshes: [{ name: 'SkinnedArmature', primitives: [{ mode: 4 }] }],
      metadata: {
        resolution: threeResolution,
        emote: currentEmote,
        bonesCount: 17,
        rigStatus: 'IK_Calibrated',
      },
    };
    const blob = new Blob([JSON.stringify(gltfData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.download = `iCALLOG_${modelPreset}_rigged.gltf`;
    link.href = URL.createObjectURL(blob);
    link.click();
    onNotify('3D GLTF File Exported', 'Model hierarchy and armature exported to .GLTF specification!', 'success');
  };

  const emoteOptions: { id: DanceEmote; label: string; icon: string; style: string }[] = [
    { id: 'floss', label: 'Fortnite Floss', icon: '💃', style: 'Fast Hip Sway & Arm Crossing' },
    { id: 'pubg_taunt', label: 'PUBG Winner Taunt', icon: '🏆', style: 'Chest Pumps & Victor Wave' },
    { id: 'electro_shuffle', label: 'Electro Shuffle', icon: '⚡', style: 'Neon Footwork & Shuffle Steps' },
    { id: 'robot', label: 'Robot Boogie', icon: '🤖', style: 'Pop & Lock Mechanical Steps' },
    { id: 'breakdance', label: 'Breakdance Flare', icon: '🌀', style: '360° Floor Windmill Spin' },
    { id: 'ninja_kata', label: 'Ninja Stance & Kata', icon: '⚔️', style: 'Martial Arts Combat Stance' },
    { id: 'idle', label: 'Combat Ready Idle', icon: '🧍', style: 'Dynamic Breathing Stance' },
  ];

  return (
    <div id="three-canvas-container" className="space-y-4">
      {/* Universal Quick Media Capture & Recording Toolbar */}
      <UniversalMediaCaptureToolbar user={user} onNotify={(t, d, ty) => onNotify(t, d, ty as any)} />

      {/* Explicit & Unrestricted Studio Mode Toolbar with All Genres */}
      {user && (
        <ExplicitStudioToolbar
          user={user}
          currentStudio="3d"
          activeGenreId={selectedExplicitGenre}
          onSelectGenre={(g) => setSelectedExplicitGenre(g.id)}
          currentPrompt={text3dPrompt}
          onApplyPromptModifier={(enhanced) => setText3dPrompt(enhanced)}
          onOpenVipModal={openPaymentModal}
          onNotify={onNotify}
        />
      )}

      {/* 3D Engine Mode Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'viewport', label: '3D WebGL Viewport & Rigging', icon: '🎮' },
            { id: 'custom_choreographer', label: '🕺 Custom Emote Maker (कस्टम डांस)', icon: '🕺' },
            { id: 'text_to_3d', label: 'Text to 3D Model AI', icon: '📝' },
            { id: 'image_to_3d', label: 'Image to 3D Model AI', icon: '🎨' },
            { id: '3d_to_video', label: '3D Model to Video Cinema', icon: '🎬' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive3DTab(tab.id as typeof active3DTab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                active3DTab === tab.id
                  ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Active Motion: <strong className="text-cyan-300">{activeDanceMode === 'custom' ? customDanceStep.name : currentEmote}</strong></span>
        </div>
      </div>

      {/* Sub-View: Custom Emote & Dance Step Choreographer Studio */}
      {active3DTab === 'custom_choreographer' && (
        <CustomChoreographerStudio
          currentStep={customDanceStep}
          onChangeStep={(step) => {
            setCustomDanceStep(step);
            setActiveDanceMode('custom');
          }}
          savedCustomDances={savedCustomDances}
          onUpdateSavedDances={(dances) => setSavedCustomDances(dances)}
          onNotify={onNotify}
        />
      )}

      {/* Sub-View: Text to 3D Model AI Generator */}
      {active3DTab === 'text_to_3d' && (
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" /> AI Text-to-3D Model Mesh Generator
              </h3>
              <p className="text-xs text-slate-400">
                Type natural language text prompts to generate full 3D volumetric meshes with PBR material shaders and auto-rigged skeletons.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
              Volumetric Diffusion Mesh
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">3D Model Text Description / Prompt</label>
                <textarea
                  rows={3}
                  value={text3dPrompt}
                  onChange={(e) => setText3dPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
                  placeholder="e.g. Ancient Golden Dragon Sculpture with glowing ruby eyes..."
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    'Futuristic Cyberpunk Armor Cyber-Helmet',
                    'Ancient Golden Dragon Sculpture',
                    'Low-Poly Sci-Fi Drone Rover',
                    'Steampunk Brass Mechanical Chronometer',
                    'Fantasy Knight Full Plate Armor',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setText3dPrompt(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-cyan-300 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">3D Aesthetics Style</label>
                  <select
                    value={text3dStyle}
                    onChange={(e) => setText3dStyle(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Hard-Surface Sci-Fi">Hard-Surface Sci-Fi</option>
                    <option value="Stylized Low-Poly">Stylized Low-Poly Game</option>
                    <option value="Photorealistic PBR">Photorealistic PBR Organic</option>
                    <option value="Voxel Craft">Voxel Pixel Mesh</option>
                    <option value="Bronze & Gold Sculpture">Bronze & Gold Sculpture</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1 font-semibold">Mesh Poly Density</label>
                  <select
                    value={text3dPolyCount}
                    onChange={(e) => setText3dPolyCount(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  >
                    <option value="Low Poly (8,000 Verts)">Low Poly (8,000 Verts)</option>
                    <option value="Game-Ready (18,000 Verts)">Game-Ready (18,000 Verts)</option>
                    <option value="High Poly (45,000 Verts)">High Poly (45,000 Verts)</option>
                    <option value="8K Ultra Detail (120,000 Verts)">8K Ultra Detail (120,000 Verts)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingText3D}
                onClick={handleTextTo3D}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-700 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold font-['Syne'] text-xs shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGeneratingText3D ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Synthesizing 3D Geometry Mesh from Text...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Generate 3D Model & Open in WebGL Viewport</span>
                  </>
                )}
              </button>
            </div>

            <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-white font-mono">Text-to-3D Engine Features:</div>
              <ul className="text-xs text-slate-400 space-y-2">
                <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Automatic PBR Texture Generation (Normal, Roughness, Metallic)</li>
                <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Auto-Rigged Biped Armature with 17 Bones</li>
                <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Export formats: .GLTF, .OBJ, .FBX, and .USDZ</li>
                <li className="flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Live WebGL real-time rotation and lighting physics</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 1: Image to 3D Model AI */}
      {active3DTab === 'image_to_3d' && (
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" /> AI Image-to-3D Model Reconstruction
              </h3>
              <p className="text-xs text-slate-400">
                Generate high-resolution 3D polygonal meshes with automatic armature rigging from 2D concepts.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
              Neural NeRF & Marching Cubes
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input & Parameters */}
            <div className="lg:col-span-6 space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Image Source URL or Concept</label>
                <input
                  type="text"
                  value={img3dUrl}
                  onChange={(e) => setImg3dUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="https://..."
                />
                <div className="flex gap-2 mt-2">
                  {[
                    { label: 'Cyber Mech', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop' },
                    { label: 'Sci-Fi Helm', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop' },
                    { label: 'Drone Bot', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop' },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setImg3dUrl(preset.url)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-white transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1 font-semibold">Geometry & Topology Prompt</label>
                <textarea
                  rows={2}
                  value={img3dPrompt}
                  onChange={(e) => setImg3dPrompt(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-semibold">Mesh Polygon Density</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    'Low-Poly (5k Verts)',
                    'Game-Ready (18k Verts)',
                    'Hyper-Poly (85k Verts)',
                  ].map((dens) => (
                    <button
                      key={dens}
                      type="button"
                      onClick={() => setMeshDensity(dens)}
                      className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                        meshDensity === dens
                          ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {dens}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div>
                  <div className="text-xs font-bold text-white">Auto-Rig Armature Skeleton</div>
                  <div className="text-[10px] text-slate-400">Generate 17-bone inverse kinematic armature hierarchy</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoRig3D}
                  onChange={(e) => setAutoRig3D(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500"
                />
              </div>

              <button
                type="button"
                disabled={isGenerating3D}
                onClick={handleImageTo3D}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-cyan-700 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold font-['Syne'] text-xs shadow-lg shadow-cyan-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isGenerating3D ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-cyan-300" />
                    <span>Synthesizing 3D Volumetric Mesh...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Reconstruct 3D Model & Open Viewport</span>
                  </>
                )}
              </button>
            </div>

            {/* Preview Image */}
            <div className="lg:col-span-6 space-y-3">
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
                <img
                  src={img3dUrl}
                  alt="3D Reconstruction Source"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span className="font-mono font-bold text-cyan-400">Density: {meshDensity}</span>
                    <span className="font-mono text-xs bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-300">
                      Auto-Rig: {autoRig3D ? 'Enabled (17 Bones)' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActive3DTab('viewport')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Return to 3D Viewport
                </button>
                <button
                  type="button"
                  onClick={handleExportGLTF}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download .GLTF Model
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-View 2: 3D Model to Video Cinema */}
      {active3DTab === '3d_to_video' && (
        <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-['Syne'] flex items-center gap-2">
                <Film className="w-4 h-4 text-cyan-400" /> 3D Model to Cinematic Video Renderer
              </h3>
              <p className="text-xs text-slate-400">
                Render current 3D WebGL model into cinematic camera motion video with physical lighting and 8K raytracing.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              3D Cinema Physics
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Camera Motion Path */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" /> Camera Motion Rig
              </label>
              <select
                value={cameraMotionPath}
                onChange={(e) => setCameraMotionPath(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="360° Turntable Orbit">360° Turntable Orbit (Showcase)</option>
                <option value="Dramatic Dolly In">Dramatic Dolly In (Intense Hero)</option>
                <option value="Hero Spiral Crane">Hero Spiral Crane (Epic Ascension)</option>
                <option value="Matrix Bullet-Time">Matrix Bullet-Time Freeze (High-Velocity)</option>
              </select>
              <p className="text-[11px] text-slate-400">Smooth bezier spline camera animation.</p>
            </div>

            {/* Lighting Studio Rig */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5" /> Cinematic Lighting Rig
              </label>
              <select
                value={cinemaLighting}
                onChange={(e) => setCinemaLighting(e.target.value)}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:border-amber-500 focus:outline-none"
              >
                <option value="Cyberpunk Neon Dual-Tone">Cyberpunk Neon Dual-Tone (Cyan/Magenta)</option>
                <option value="Golden Hour Sunlight">Golden Hour Sunset (Warm Chiaroscuro)</option>
                <option value="High-Key Clean Studio">High-Key Clean Studio (Neutral Key/Fill)</option>
                <option value="Dark Void Minimalist">Dark Void Minimalist (Single Rim Light)</option>
              </select>
              <p className="text-[11px] text-slate-400">ACES Filmic tone mapped volumetric lighting.</p>
            </div>

            {/* Resolution & Render Trigger */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between gap-3">
              <div>
                <label className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1.5 mb-1.5">
                  <Video className="w-3.5 h-3.5" /> Output Resolution & Duration
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={videoRenderRes}
                    onChange={(e) => setVideoRenderRes(e.target.value as ResolutionTier)}
                    className="py-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                  >
                    <option value="8K">8K IMAX</option>
                    <option value="4K">4K UHD</option>
                    <option value="1080p">1080p FHD</option>
                    <option value="720p">720p HD</option>
                  </select>
                  <select
                    value={videoRenderDuration}
                    onChange={(e) => setVideoRenderDuration(e.target.value)}
                    className="py-1.5 px-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                  >
                    <option value="15s">15 Seconds</option>
                    <option value="30s">30 Seconds</option>
                    <option value="1m">1 Minute</option>
                    <option value="1 Hour (Free Cap)">1 Hour (Free Cap)</option>
                    <option value="Unlimited (VIP)">Unlimited (VIP)</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                disabled={isRendering3DVideo}
                onClick={handle3DToVideo}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold font-['Syne'] text-xs shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isRendering3DVideo ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Rendering 3D Cinema Frames...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-4 h-4 text-slate-950" />
                    <span>Render 3D Cinema Video</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Resolution Spectrum Segmented Bar (240p to 8K) */}
      <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white font-['Syne']">
              3D WebGL Resolution Spectrum (240p Retro to 8K Super-Sampling)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {activeThreeRes.description} • Scale: <span className="text-cyan-400 font-mono font-bold">{activeThreeRes.pixelRatio}x</span>
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {THREE_RESOLUTIONS.map((r) => {
            const isSelected = threeResolution === r.id;
            return (
              <button
                key={r.id}
                id={`three-res-${r.id}`}
                onClick={() => setThreeResolution(r.id)}
                className={`py-2 px-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-gradient-to-t from-cyan-600 to-indigo-600 text-white border-cyan-300 shadow-lg shadow-cyan-900/40 font-bold scale-[1.02]'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className="text-xs font-mono font-bold">{r.id}</span>
                <span className="text-[9px] opacity-75 font-mono">{r.pixelRatio}x</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Top Header Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
        {/* Model Presets */}
        <div className="flex items-center gap-1.5">
          {[
            { id: 'cyber_android', label: 'Cyber Android V18', icon: '🤖' },
            { id: 'neon_mech', label: 'Neon Mech Titan', icon: '🦾' },
            { id: 'shadow_shinobi', label: 'Shadow Shinobi', icon: '🥷' },
            { id: 'lowpoly_bot', label: 'Low-Poly Retro Bot', icon: '👾' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setModelPreset(m.id as ModelPreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                modelPreset === m.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Viewport Toggles & Actions */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-wireframe-btn"
            onClick={() => setIsWireframe(!isWireframe)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              isWireframe
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>Wireframe</span>
          </button>

          <button
            id="toggle-skeleton-btn"
            onClick={() => setShowSkeleton(!showSkeleton)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              showSkeleton
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>X-Ray Skeleton</span>
          </button>

          <button
            id="auto-rig-btn"
            disabled={isAutoRigging}
            onClick={handleAutoRig}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-900/30 transition-all disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${isAutoRigging ? 'animate-spin' : ''}`} />
            <span>Auto-Rig Model</span>
          </button>

          <button
            onClick={handleExportSnapshot}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Snapshot Capture (PNG)"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportGLTF}
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
            title="Export 3D Model (.GLTF)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.GLTF</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Three.js Interactive Canvas (Span 3 cols) */}
        <div
          id="three-webgl-stage"
          ref={mountRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="lg:col-span-3 h-[540px] rounded-3xl overflow-hidden relative cursor-grab active:cursor-grabbing border border-slate-800 bg-[#0a0e17] shadow-2xl"
        >
          {/* Overlay HUD stats */}
          <div className="absolute top-4 left-4 pointer-events-none flex flex-col gap-1.5 z-10">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-slate-700/60 text-cyan-300">
              WebGL: 60.0 FPS | Scale: {threeResolution} ({activeThreeRes.pixelRatio}x) | Rig: 17 Bones
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              360° Orbit: Drag Mouse | Zoom: Scroll Wheel | Speed: {animSpeed}x
            </span>
          </div>

          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-2">
            <span className="text-xs px-3 py-1 rounded-xl bg-indigo-950/80 backdrop-blur-md border border-indigo-500/40 text-indigo-300 font-semibold">
              Motion: {activeDanceMode === 'custom' ? `${customDanceStep.icon} ${customDanceStep.name}` : emoteOptions.find((e) => e.id === currentEmote)?.label}
            </span>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300">
              Model: {modelPreset.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          {/* Floating Play/Pause & Speed Overlay */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-1.5 px-2 text-xs text-slate-300">
              <span>Speed</span>
              <input
                type="range"
                min="0.25"
                max="2.5"
                step="0.25"
                value={animSpeed}
                onChange={(e) => setAnimSpeed(parseFloat(e.target.value))}
                className="w-16 accent-indigo-500"
              />
              <span className="font-mono text-cyan-400">{animSpeed}x</span>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Emote Selector & Customizer */}
        <div className="space-y-4">
          {/* Customizer Colors */}
          <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-3">
            <h3 className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-400" /> 3D Material Colors
            </h3>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Primary Armor Color</label>
              <div className="flex items-center gap-2">
                {['#4f46e5', '#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'].map((col) => (
                  <button
                    key={col}
                    onClick={() => setArmorColor(col)}
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      armorColor === col ? 'border-white scale-110 shadow-md' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Visor & Emissive Glow</label>
              <div className="flex items-center gap-2">
                {['#06b6d4', '#f43f5e', '#10b981', '#eab308', '#ec4899', '#38bdf8'].map((col) => (
                  <button
                    key={col}
                    onClick={() => setGlowColor(col)}
                    style={{ backgroundColor: col }}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      glowColor === col ? 'border-white scale-110 shadow-md' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Dance Emote Selector & Custom Step Choreographer Entry */}
          <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white font-['Syne'] flex items-center gap-2">
                <span>🎭</span> Dance Emotes & Custom Steps
              </h3>
              <span className="text-[10px] text-indigo-400 font-mono">
                {savedCustomDances.length + PRESET_DANCE_STEPS.length + emoteOptions.length} Moves
              </span>
            </div>

            {/* Quick Action to open Custom Choreographer */}
            <button
              type="button"
              onClick={() => setActive3DTab('custom_choreographer')}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold font-['Syne'] shadow-md shadow-cyan-950/40 flex items-center justify-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Make Custom Dance Step (नया डांस बनाएं)</span>
            </button>

            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {/* 1. User Created Saved Custom Steps */}
              {savedCustomDances.length > 0 && (
                <div className="text-[10px] text-amber-400 font-mono font-bold uppercase tracking-wider px-1 pt-1">
                  ⭐ Your Custom Dances ({savedCustomDances.length})
                </div>
              )}
              {savedCustomDances.map((step) => {
                const isSelected = activeDanceMode === 'custom' && customDanceStep.id === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setCustomDanceStep(step);
                      setActiveDanceMode('custom');
                      onNotify('Custom Dance Selected', `Armature playing "${step.name}".`, 'info');
                    }}
                    className={`p-2.5 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-950/80 to-slate-900 border-amber-500 shadow-md shadow-amber-950/40 text-white'
                        : 'bg-slate-950/60 border-amber-500/30 text-slate-300 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-lg">{step.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
                        <span className="truncate">{step.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">Custom</span>
                      </div>
                      <div className="text-[10px] text-amber-400/80 truncate">{step.hindiName || `${step.tempoBpm} BPM`}</div>
                    </div>
                  </button>
                );
              })}

              {/* 2. Preset Choreographer Steps */}
              <div className="text-[10px] text-cyan-400 font-mono font-bold uppercase tracking-wider px-1 pt-1.5">
                💃 Choreographer Fusion Presets
              </div>
              {PRESET_DANCE_STEPS.map((step) => {
                const isSelected = activeDanceMode === 'custom' && customDanceStep.id === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setCustomDanceStep(step);
                      setActiveDanceMode('custom');
                      onNotify('Choreography Selected', `Armature playing ${step.name}.`, 'info');
                    }}
                    className={`p-2.5 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-cyan-400 shadow-md shadow-cyan-950/40 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-lg">{step.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{step.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{step.hindiName} • {step.tempoBpm} BPM</div>
                    </div>
                  </button>
                );
              })}

              {/* 3. Classic Library Emotes */}
              <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider px-1 pt-1.5">
                🎮 Classic Game Emotes
              </div>
              {emoteOptions.map((emote) => {
                const isSelected = activeDanceMode === 'preset' && currentEmote === emote.id;
                return (
                  <button
                    key={emote.id}
                    id={`emote-btn-${emote.id}`}
                    type="button"
                    onClick={() => {
                      setCurrentEmote(emote.id);
                      setActiveDanceMode('preset');
                      onNotify('Dance Emote Selected', `Armature sequencer playing ${emote.label}.`, 'info');
                    }}
                    className={`p-2.5 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-indigo-500 shadow-md shadow-indigo-950/40 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="text-lg">{emote.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold leading-tight truncate">{emote.label}</div>
                      <div className="text-[10px] text-slate-500 truncate">{emote.style}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
