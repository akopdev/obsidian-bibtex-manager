import { MarkdownView, Notice } from "obsidian";
import { BaseModal } from "./base";
import { Citation } from "../../modules";
import { parse } from "@retorquere/bibtex-parser";
import { Entry } from "@retorquere/bibtex-parser/grammar";


export class CreateModal extends BaseModal {
	title = "Create";

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
				const fName =
					(await this.formatBibTexEntry(
						citation,
						entry,
						this.settings.fileName,
					)) || "Untitled";
				const fileName = this.generateNewFileNameInFolder(fName);
				const newFile = await this.app.vault.create(
					fileName,
					note,
					{},
				);
				if (newFile){
					await this.app.workspace.getLeaf("tab").openFile(newFile);
				}
			}
		} catch (e) {
			new Notice("Error processing BibTeX entries")
			console.error(e);
		}

		this.close();
	}
}
