import * as THREE from 'three';

export class Renderer3D {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Mouse camera control
  private cameraAngle = 0;
  private cameraPitch = 0.3;
  private cameraDistance = 25;
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  constructor(canvas: HTMLCanvasElement) {
    // Scene
    this.scene = new THREE.Scene();

    // Background color
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Camera - positioned for 3D view
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 20);
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Lights
    this.setupLights();

    // Ground
    this.setupGround();

    // Resize handler
    window.addEventListener('resize', () => this.resize());

    // Mouse controls
    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    window.addEventListener('mouseup', () => this.isDragging = false);
    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.cameraAngle -= dx * 0.005;
      this.cameraPitch = Math.max(0.1, Math.min(1.2, this.cameraPitch + dy * 0.005));
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });
    canvas.addEventListener('wheel', (e) => {
      this.cameraDistance = Math.max(10, Math.min(50, this.cameraDistance + e.deltaY * 0.02));
    });
  }

  private setupLights(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // Main directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(10, 20, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -30;
    sun.shadow.camera.right = 30;
    sun.shadow.camera.top = 30;
    sun.shadow.camera.bottom = -30;
    this.scene.add(sun);

    // Fill light
    const fill = new THREE.DirectionalLight(0x88aaff, 0.4);
    fill.position.set(-10, 10, -10);
    this.scene.add(fill);

    // Rim light
    const rim = new THREE.DirectionalLight(0xffaa88, 0.3);
    rim.position.set(0, 5, -15);
    this.scene.add(rim);
  }

  private setupGround(): void {
    // Grid floor
    const gridHelper = new THREE.GridHelper(40, 40, 0x444444, 0x333333);
    gridHelper.position.y = -2;
    this.scene.add(gridHelper);

    // Shadow-catching plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.4 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private resize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  updateCamera(_deltaTime: number): void {
    // Auto rotate slowly if not dragging
    if (!this.isDragging) {
      this.cameraAngle += 0.001;
    }

    // Position camera based on angle, pitch, distance
    this.camera.position.x = Math.sin(this.cameraAngle) * this.cameraDistance * Math.cos(this.cameraPitch);
    this.camera.position.z = Math.cos(this.cameraAngle) * this.cameraDistance * Math.cos(this.cameraPitch);
    this.camera.position.y = this.cameraDistance * Math.sin(this.cameraPitch);
    this.camera.lookAt(0, 0, 0);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
