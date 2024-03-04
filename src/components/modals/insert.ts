import { App, MarkdownView, Notice, Setting } from "obsidian";
import { BaseModal } from "./base";
import { BibTeXTypes } from "../settings";
import { Citation } from "../../modules";
import { parse } from "@retorquere/bibtex-parser";

export class InsertModal extends BaseModal {
	async onSubmit(text: string) {
		const viewer = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!viewer) {
			new Notice("No active editor");
			return;
		}
		try {
			const citation = new Citation(this.settings.cslStyle, false);

			await citation.init();

			// @ts-ignore
			parse(text).entries.forEach(async (entry: Entry) => {
				const template = await this.getTemplate(entry);
				const note = await this.formatBibTexEntry(
					citation,
					entry,
					template,
				);
				if (note) {
					viewer.editor.replaceSelection(note + "\n");
				}
			});
		} catch (e) {
			console.error(e);
		}

		this.close();
	}

	async onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Insert BibTeX" });

		new Setting(contentEl)
			.addTextArea((text) => {
				text.setPlaceholder(
					"Paste the content of your BibTeX file",
				).onChange((value) => {
					this.bibtex = value;
				});
				text.inputEl.addClass("bibtex-manager-template");
			})
			.setClass("bibtex-manager-template-container");

		new Setting(contentEl).setName("Apply template").addDropdown((cb) => {
			cb.addOption("", "Auto detect");
			BibTeXTypes.forEach((type) => cb.addOption(type, type));

			cb.onChange((value) => {
				this.template = value ? BibTeXTypes[value] : "";
			});
		});

		new Setting(contentEl)
			.addButton((btn) => {
				btn.setButtonText("Cancel").onClick(() => {
					this.close();
				});
			})
			.addButton((btn) =>
				btn
					.setButtonText("Insert")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.bibtex);
					}),
			);
	}
}
