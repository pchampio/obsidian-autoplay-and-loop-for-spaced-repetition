import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface AutoplayCardSettings {
  autoplayAudio: boolean;
  autoplayVideo: boolean;
}

const DEFAULT_SETTINGS: AutoplayCardSettings = {
  autoplayAudio: true,
  autoplayVideo: true,
};

export default class AutoplayCardPlugin extends Plugin {
  settings: AutoplayCardSettings;

  async onload() {
    console.log('AutoplayCard Plugin LOADED');

    await this.loadSettings();
    this.addSettingTab(new AutoplayCardSettingTab(this.app, this));

    const observer = new MutationObserver(() => this.checkAndPlayMedia());

    const observeTarget = () => {
      const targetButtons = document.querySelectorAll(
        'button.sr-response-button.sr-hard-button.sr-bg-red',
      );
      targetButtons.forEach((btn) => {
        observer.observe(btn, { attributes: true, attributeFilter: ['class'] });
      });
    };

    this.registerInterval(
      window.setInterval(() => {
        this.checkAndPlayMedia();
        observeTarget(); // keep observing dynamically added buttons
      }, 1000),
    );
  }

  onunload() {
    console.log('AutoplayCard Plugin UNLOADED');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  checkAndPlayMedia() {
    const mediaElements = document.querySelectorAll(
      '.sr-content audio, .sr-content video',
    );

    const isAnyTargetButtonVisible = Array.from(
      document.querySelectorAll(
        'button.sr-response-button.sr-hard-button.sr-bg-red',
      ),
    ).some((btn) => !btn.classList.contains('sr-is-hidden'));

    mediaElements.forEach((mediaElement) => {
      const tag = mediaElement.tagName.toLowerCase();
      const isVideo = tag === 'video';
      const isAudio = tag === 'audio';

      if (
        (isVideo && this.settings.autoplayVideo) ||
        (isAudio && this.settings.autoplayAudio && isAnyTargetButtonVisible)
      ) {
        const el = mediaElement as HTMLMediaElement;
        el.autoplay = true;
        el.play().catch((e) => {
          console.warn('Playback failed:', e);
        });
      }
    });
  }
}

class AutoplayCardSettingTab extends PluginSettingTab {
  plugin: AutoplayCardPlugin;

  constructor(app: App, plugin: AutoplayCardPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Autoplay Settings' });

    new Setting(containerEl)
      .setName('AutoplayCard Audio')
      .setDesc('Play audio in cards')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoplayAudio)
          .onChange(async (value) => {
            this.plugin.settings.autoplayAudio = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Autoplay Video')
      .setDesc('Automatically play video in cards')
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoplayVideo)
          .onChange(async (value) => {
            this.plugin.settings.autoplayVideo = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
