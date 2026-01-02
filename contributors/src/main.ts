import { Renderer3D } from './core/Renderer3D';
import { Pet3D } from './core/Pet3D';
import { fetchContributors, type GitHubContributor } from './services/github';

// Config - change this to your repo
const GITHUB_OWNER = 'anisayari';
const GITHUB_REPO = 'voyonsvoir';

class App {
  private renderer: Renderer3D;
  private pets: Pet3D[] = [];
  private lastTime: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer3D(canvas);
  }

  async init(): Promise<void> {
    try {
      // Fetch contributors from GitHub
      const contributors = await fetchContributors(GITHUB_OWNER, GITHUB_REPO);
      console.log(`Loaded ${contributors.length} contributors`);

      // Create 3D pets from contributors
      await this.createPets(contributors);

      // Start game loop
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.gameLoop(t));
    } catch (error) {
      console.error('Failed to initialize:', error);
      // Fallback: create demo pets
      await this.createDemoPets();
      this.lastTime = performance.now();
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  private async createPets(contributors: GitHubContributor[]): Promise<void> {
    const maxPets = Math.min(contributors.length, 12);
    const maxContributions = Math.max(...contributors.map(c => c.contributions));

    // Spread pets in a nice pattern across XZ plane
    for (let i = 0; i < maxPets; i++) {
      const contributor = contributors[i];

      // Spiral/circular distribution
      const angle = (i / maxPets) * Math.PI * 2 + Math.random() * 0.5;
      const radius = 3 + (i % 3) * 3 + Math.random() * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pet = new Pet3D(contributor, x, z, i, maxContributions);
      await pet.init(this.renderer);
      pet.addToScene(this.renderer.scene);
      this.pets.push(pet);
    }
  }

  private async createDemoPets(): Promise<void> {
    const demoContributors: GitHubContributor[] = [
      {
        login: 'octocat',
        id: 1,
        avatar_url: 'https://github.com/octocat.png',
        contributions: 100
      },
      {
        login: 'github',
        id: 2,
        avatar_url: 'https://github.com/github.png',
        contributions: 50
      },
      {
        login: 'torvalds',
        id: 3,
        avatar_url: 'https://github.com/torvalds.png',
        contributions: 25
      }
    ];

    const maxContributions = Math.max(...demoContributors.map(c => c.contributions));

    for (let i = 0; i < demoContributors.length; i++) {
      const angle = (i / demoContributors.length) * Math.PI * 2;
      const radius = 4;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const pet = new Pet3D(demoContributors[i], x, z, i, maxContributions);
      await pet.init(this.renderer);
      pet.addToScene(this.renderer.scene);
      this.pets.push(pet);
    }
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update camera orbit
    this.renderer.updateCamera(deltaTime);

    // Update all pets
    for (const pet of this.pets) {
      pet.update(deltaTime);
    }

    // Render scene
    this.renderer.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Start app when DOM is ready
window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  // Show loading state
  document.body.style.background = '#1a1a2e';

  const app = new App(canvas);
  await app.init();
});
