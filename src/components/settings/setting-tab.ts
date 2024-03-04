import { Core } from "../core";
import { FileSuggest, FolderSuggest, CSLSuggest } from "../../modules";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import { BibTeXTypes } from "./types";

export class SettingTab extends PluginSettingTab {
	plugin: Core;

	constructor(app: App, plugin: Core) {
		super(app, plugin);
		this.plugin = plugin;
		this.app = app;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "General" });

		new Setting(this.containerEl)
			.setName("Citation style ID")
			.addSearch((cb) => {
				new CSLSuggest(this.app, cb.inputEl);
				cb.setPlaceholder("CSL Style: style-name")
					.setValue(this.plugin.settings.cslStyle)
					.onChange((style) => {
						this.plugin.settings.cslStyle = style;
						this.plugin.saveSettings();
					});
				// @ts-ignore
				cb.containerEl.addClass("bibtex-manager-search");
			});
		new Setting(containerEl)
			.setName("Render BibTeX code block as citation")
			.setDesc(
				"Render BibTeX code block as citation using the selected CSL style.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableBibtexFormatting)
					.onChange(async (value) => {
						this.plugin.settings.enableBibtexFormatting = value;
						await this.plugin.saveSettings();
						new Notice(
							"Please reload the app to apply the changes",
						);
					}),
			);
		new Setting(containerEl)
			.setName("Default file name")
			.setDesc("Default file name for new notes.")
			.addText((text) => {
				text.setValue(this.plugin.settings.fileName);
				text.onChange(async (value) => {
					this.plugin.settings.fileName = value;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName("Create in the default folder.")
			.setDesc(
				"Create the new files in the default folder as per Obsidian's configuration.",
			)
			.addToggle((cb) => {
				cb.setValue(this.plugin.settings.useDefaultFolder);
				cb.onChange(async (value) => {
					this.plugin.settings.useDefaultFolder = value;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName("Custom folder for new notes.")
			.setDesc("Create the new files in the specified folder.")
			.addSearch((cb) => {
				new FolderSuggest(this.app, cb.inputEl);
				cb.setValue(this.plugin.settings.customFolder)
					.setPlaceholder("folder 1/folder 2")
					.onChange((folder) => {
						this.plugin.settings.customFolder = folder;
						this.plugin.saveSettings();
					});
				// @ts-ignore
				cb.containerEl.addClass("bibtex-manager-search");
			});

		containerEl.createEl("h2", { text: "Templates" });

		BibTeXTypes.forEach((type) => {
			new Setting(containerEl).setName(type).addSearch((cb) => {
				new FileSuggest(this.app, cb.inputEl);
				cb.setValue(this.plugin.settings[`template${type}`]).onChange(
					(folder) => {
						this.plugin.settings[`template${type}`] = folder;
						this.plugin.saveSettings();
					},
				);
				// @ts-ignore
				cb.containerEl.addClass("bibtex-manager-search");
			});
		});
	}
}
