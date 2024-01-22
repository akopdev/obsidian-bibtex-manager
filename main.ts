import { App, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface CiteManagerSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: CiteManagerSettings = {
	template: ''
}

export default class CiteManager extends Plugin {
	settings: CiteManagerSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'insert-citation',
			name: 'Insert citation',
			callback: () => {
				new InsertCitationModal(this.app, this.settings).open();
			}
		});

		this.addSettingTab(new CiteManagerSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class InsertCitationModal extends Modal {
	citation: string;

	constructor(app: App, settings: CiteManagerSettings) {
		super(app);
		this.settings = settings;
	}

	onSubmit(text: string) {
		const editor = this.app.workspace.getActiveViewOfType(MarkdownView).editor;
		let template = this.settings.template;

		const pattern = /\s*([a-zA-Z_]+)\s*=\s*({.+?}|\d+)/g;
		const found = text.match(pattern);

		if (found === null) {
			return this.close();
		}

		found.forEach((element) => {
			const [key, value] = element.trim().split('=');
			template = template.replace("{{" + key + "}}", value.replace(/^\{+|\}+$/g, ''));
		})

		template = template.replace(/\*\*[^*]+\*\*:\s*{{[^}}]+}}\n/g, "");

		editor.replaceSelection(template);

		this.close();

	}

	onOpen() {
		const { contentEl } = this;


		contentEl.createEl("h1", { text: "Citation" });

		new Setting(contentEl)
			.addTextArea(text =>
				text.setPlaceholder('Enter your citation')
					.onChange((value) => {
						this.citation = value
					}));

		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Cancel")
					.onClick(() => {
						this.close();
					});
			})
			.addButton((btn) =>
				btn
					.setButtonText("Insert")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.citation);
					}));

	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class CiteManagerSettingTab extends PluginSettingTab {
	plugin: CiteManager;

	constructor(app: App, plugin: CiteManager) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Template')
			.setDesc('Note template for citations')
			.addTextArea(text =>
				text.setPlaceholder('Enter your template')
					.setValue(this.plugin.settings.template)
					.onChange(async (value) => {
						this.plugin.settings.template = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
