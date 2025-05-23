import { BibTexProvider } from './base';
import { ArXivProvider } from './arxiv';
import { GoogleBooksProvider } from './googlebooks';

type BibTexProviderConstructor = new (url: string) => BibTexProvider;

export const BibTexProviders: BibTexProviderConstructor[] = [
	ArXivProvider,
	GoogleBooksProvider,
];
