export interface BibTexProvider {
	match(): boolean;
	fetch(): Promise<string>;
}
