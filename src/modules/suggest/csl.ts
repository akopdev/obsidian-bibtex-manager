import { cslList, CSLItem } from "./csl-list";
import { AbstractInputSuggest } from "obsidian";


export class CSLSuggest extends AbstractInputSuggest<CSLItem> {
	textInputEl: HTMLInputElement;

	getSuggestions(inputStr: string): CSLItem[] {
		const lowerCaseInputStr = inputStr.toLowerCase();
		const items: Array<CSLItem> = [];
		const listItem = cslList.forEach((item: CSLItem) => {
			if (item.label.toLowerCase().contains(lowerCaseInputStr)) {
				items.push(item);
			}
		});

		return items;
	}

	renderSuggestion(item: CSLItem, el: HTMLElement): void {
		el.setText(item.label);
	}

	selectSuggestion(item: CSLItem): void {
		this.textInputEl.value = item.id;
		this.textInputEl.trigger("input");
		this.close();
	}
}
