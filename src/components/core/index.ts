import { Plugin } from "obsidian";
import { Settings, DefaultSettings } from "../settings";

export class Core extends Plugin {
	settings: Settings;

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DefaultSettings,
			await this.loadData(),
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
