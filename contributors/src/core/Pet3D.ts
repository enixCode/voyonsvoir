import * as THREE from 'three';
import { Renderer3D } from './Renderer3D';
import type { GitHubContributor } from '../services/github';

export class Pet3D {
  private group: THREE.Group;
  private avatar: THREE.Sprite;
  private shadow: THREE.Mesh;
  private scale: number;
  private time = Math.random() * 100;
  private avatarUrl: string;
  private vy = 0;

  constructor(
    contributor: GitHubContributor,
    x: number,
    z: number,
    _index: number,
    maxContributions: number
  ) {
    this.avatarUrl = contributor.avatar_url;

    const norm = Math.min(contributor.contributions / Math.max(maxContributions, 1), 1);
    this.scale = 0.8 + norm * 1.2;

    this.group = new THREE.Group();
    this.group.position.set(x, this.scale, z);

    // Avatar sprite (always faces camera)
    this.avatar = new THREE.Sprite(
      new THREE.SpriteMaterial({ transparent: true })
    );
    this.avatar.scale.set(this.scale * 2, this.scale * 2, 1);
    this.group.add(this.avatar);

    // Shadow
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 32),
      new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.2 })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = -this.scale + 0.01;
    this.shadow.scale.setScalar(this.scale);
    this.group.add(this.shadow);

    // Label
    this.addLabel(contributor.login, contributor.contributions);
  }

  private addLabel(name: string, commits: number): void {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 128;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.roundRect(16, 16, 480, 96, 16);
    ctx.fill();
    ctx.font = 'bold 36px Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(name.slice(0, 14), 256, 60);
    ctx.font = '22px Arial';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`${commits} commits`, 256, 90);

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true })
    );
    sprite.position.y = -this.scale - 0.5;
    sprite.scale.set(3, 0.75, 1);
    this.group.add(sprite);
  }

  async init(_renderer: Renderer3D): Promise<void> {
    const tex = await this.loadAvatar(this.avatarUrl);
    if (tex) {
      this.avatar.material.map = tex;
      this.avatar.material.needsUpdate = true;
    }
  }

  private loadAvatar(url: string): Promise<THREE.Texture | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        // Circle clip
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, 0, 0, size, size);

        // Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 8;
        ctx.stroke();

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        resolve(tex);
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  addToScene(scene: THREE.Scene): void {
    scene.add(this.group);
  }

  update(dt: number): void {
    this.time += dt * 0.001;
    const s = this.scale;

    // Soft floating
    this.vy -= 0.0001 * dt;
    this.group.position.y += this.vy * dt;

    if (this.group.position.y < s) {
      this.group.position.y = s;
      this.vy = Math.abs(this.vy) * 0.3;

      // Random gentle hop
      if (Math.random() < 0.005) {
        this.vy = 0.02 + Math.random() * 0.02;
      }
    }

    // Gentle bob
    const bob = Math.sin(this.time * 2) * 0.1;
    this.avatar.position.y = bob * s;

    // Shadow
    const height = this.group.position.y - s;
    this.shadow.position.y = -this.group.position.y + 0.01;
    this.shadow.scale.setScalar(s * (1 - height * 0.1));
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.2 * (1 - height * 0.15);
  }
}
