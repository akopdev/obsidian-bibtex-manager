import { App, MarkdownView, Notice } from "obsidian";
import { BaseModal } from "./base";
import { Citation } from "../../modules";
import { parse } from "@retorquere/bibtex-parser";

export class InsertModal extends BaseModal {
	title = "Insert";

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
			const entries: Entry[] = parse(text).entries
			for (const entry of entries) {
				const template = await this.getTemplate(entry);
				const note = await this.formatBibTexEntry(
					citation,
					entry,
					template,
				);
				if (note) {
					viewer.editor.replaceSelection(note + "\n");
				}
			}
		} catch (e) {
			new Notice("Error processing BibTeX entries")
			console.error(e);
		}

		this.close();
	}
}
