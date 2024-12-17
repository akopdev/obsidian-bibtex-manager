import { BibTexProvider } from './base';
import { ArXivProvider } from './arxiv';

type BibTexProviderConstructor = new (url: string) => BibTexProvider;

export const BibTexProviders: BibTexProviderConstructor[] = [
	ArXivProvider,
];
