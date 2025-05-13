import* as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Stats from 'three/examples/jsm/libs/stats.module';
import {gsap} from "gsap";

export default class SceneInit {
  
  constructor(canvasId) {
    // NOTE: Core components to initialize Three.js app.
    this.scene = undefined;
    this.camera = undefined;
    this.renderer = undefined;
    this.cameraAnimation = null;
    this.animationActions = [];

    // // NOTE: Analyzer;
    // this.bars = [];
    // this.analyser = null;
    // this.dataArray = null;

    // NOTE: Camera params;
    this.fov = 45;
    // this.nearPlane = 1;
    // this.farPlane = 2000;
    this.canvasId = canvasId;

    // NOTE: Additional components.
    this.clock = undefined;
    this.stats = undefined;
    this.controls = undefined;
      this.mixer = null;
    // NOTE: Lighting is basically required.
    this.isAnimating = false;
    this.cameraAnimation = null;

  
  }

  createBackgroundPlane(texture) {

    this.scene.background = new THREE.Color('#FFFFFF');
    const geometry = new THREE.PlaneGeometry(512, 206);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0, // начально невидим
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 200, -550);
    this.scene.add(plane);

    // Анимируем плавное появление
    gsap.to(material, {
      opacity: 1,
      duration: 10,
      delay: 0.3,
      ease: "sine.out"
    });


    this.backgroundPlane = plane; // сохраняем, если нужно управлять позже
  }
  
  initialize(backgroundTexture = null) {

    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      window.innerWidth / window.innerHeight,
      1,
      1500
    );
    this.camera.position.set(0, 700, 0);
    this.camera.lookAt(0,-400,0);
    
    const canvas = document.getElementById(this.canvasId);
    const isTablet = /iPad|Tablet|PlayBook|Nexus 7|Nexus 10|KFAPWI/i.test(navigator.userAgent);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isTablet,
      powerPreference: "high-performance" 
    });
    // const DPR = window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio, 2);
    
    const DPR = isTablet ? 0.25 : (window.innerWidth < 1024 ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setPixelRatio(DPR);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    
    this.clock = new THREE.Clock();
    // this.stats = Stats();
    // document.body.appendChild(this.stats.dom);
    
    window.addEventListener('resize', () => this.onWindowResize(), false);

    if (backgroundTexture) {
      this.createBackgroundPlane(backgroundTexture);
    }
    
  }

  addInstagramCubeWithLink() {
    const loader = new THREE.TextureLoader();

    loader.load('/instagram.png', (logoTexture) => {
      const size = 200;
      const geometry = new THREE.BoxGeometry(size, size, 50);

      const gradientMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.4,
        metalness: 0.3,
      });

      // Используем логотип Instagram для передней стороны, остальное — градиент/цвет
      const materials = [
        gradientMaterial, // right
        gradientMaterial, // left
        gradientMaterial, // top
        gradientMaterial, // bottom
        new THREE.MeshBasicMaterial({ map: logoTexture }), // front
        gradientMaterial, // back
      ];

      const cube = new THREE.Mesh(geometry, materials);
      cube.position.set(300, -10, -600); // можно поменять
      cube.name = 'instagramCube'; // используем для клика
      cube.userData.link = 'https://www.instagram.com/vbk.detailing?igsh=YzZidmc0Y2s4MmFp&utm_source=qr'; 
      cube.castShadow = true;
      cube.receiveShadow = true;

      this.scene.add(cube);
    });
  }
  
  startCameraAnimation() {
    if (this.isAnimating || this.cameraAnimation) return; // Блок повторных кликов

    this.isAnimating = true;
    const center = new THREE.Vector3(0, 0, 0);

    this.cameraAnimation = gsap.timeline({
      onUpdate: () => {
        this.camera.lookAt(center);
      },
      onComplete: () => {
        this.cameraAnimation.kill();
        this.cameraAnimation = null;
        this.isAnimating = false;

        this.initOrbitControls();
        if (this.controls) this.controls.enabled = true;
        this.renderer.compile(this.scene, this.camera);
   

        console.log("Camera animation finished. Controls enabled.");
      }
    });

    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    this.cameraAnimation
        .to(this.camera.position, {
          duration: 5,
          x: 0,
          y: 100,
          z: 900,
          ease: "power2.out"
        })
        .to(this.camera.position, {
          duration: 5,
          x: 0,
          y: 100,
          z: 700,
          ease: "power2.inOut"
        });
  }


  initOrbitControls() {
    if (this.controls) {
      this.controls.dispose();
    }

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minPolarAngle = Math.PI / 4;
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.enablePan = false;
    this.controls.maxDistance = 900;
    this.controls.minDistance = 400;

    // <-- Добавь это ↓
    this.controls.enabled = false; // Сначала отключено

    this.renderer.shadowMap.enabled = false;

    // Активируем только если разрешено
    if (this.isAnimating === false) {
      this.controls.enabled = true;
    }
  }
  startAnimation() {
    this.isAnimating = true;
  }


  
  animate() {
    // NOTE: Window is implied.
    // requestAnimationFrame(this.animate.bind(this));
    window.requestAnimationFrame(this.animate.bind(this));
    this.render();
    if (this.mixer) {
        const delta = this.clock.getDelta();
        this.mixer.update(delta);
    }
    
    // this.stats.update();

    if (this.controls?.enabled) {
      this.controls.update();
    }
    // this.controls.update();
    // if (this.analyser && this.dataArray) {
    //   this.analyser.getByteFrequencyData(this.dataArray);
    //   for (let i = 0; i < this.bars.length; i++) {
    //     const scale = this.dataArray[i] / 20;
    //     this.bars[i].scale.y = Math.max(scale, 1);
    //     this.bars[i].material.color.setHSL(scale / 10, 1, 0.5);
    //   }
    // }
  }

  render() {
    // NOTE: Update uniform data on each render.
    // this.uniforms.u_time.value += this.clock.getDelta();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);}
}