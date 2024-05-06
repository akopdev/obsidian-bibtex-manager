Basic BibTeX entry types
========================

A list of the 14 basic BibTeX entry types with descriptions and examples.

## 1. Article

An article from a journal or magazine.

```bibtex
@article{CitekeyNewArticle,
 author    = "A. Einstein",
 title     = "On the Electrodynamics of Moving Bodies",
 journal   = "Annalen der Physik",
 year      = 1905,
 volume    = "17",
 number    = "10",
 pages     = "891--921",
}
```

## 2. Book

A book with an explicit publisher.

```bibtex
@book{CitekeyNewBook,
 author    = "Isaac Newton",
 title     = "The Principia: Mathematical Principles of Natural Philosophy",
 publisher = "University of California Press",
 address   = "Berkeley, CA",
 year      = 1999
}
```

## 3. Booklet

A work that is printed and bound, but without a named publisher or sponsoring institution.

```bibtex
@booklet{CitekeyNewBooklet,
 title        = "Guide to the Alpine Flora",
 author       = "Elisabeth Schmitt",
 howpublished = "Available at the Bern Tourism Office",
 month        = aug,
 year         = 2018
}
```

## 4. InBook

A part of a book, which may be a chapter (or section or whatever) and/or a range of pages.

```bibtex
@inbook{CitekeyNewInbook,
 author    = "Neil deGrasse Tyson",
 title     = "The Cosmic Perspective",
 booktitle = "Astrophysics for People in a Hurry",
 year      = "2017",
 publisher = "W. W. Norton & Company",
 address   = "New York, NY",
 pages     = "12--45"
}
```

## 5. InCollection

A part of a book having its own title. For example, a chapter in a collection of essays.

```bibtex
@incollection{CitekeyNewIncollection,
 author    = "Mary Shelley",
 editor    = "John Smith and Joan Doe",
 title     = "Reanimating Life",
 booktitle = "Gothic Tales",
 year      = 2020,
 publisher = "Fictional University Press",
 address   = "London, UK",
 pages     = "101--120"
}
```

## 6. InProceedings

An article in a conference proceedings.

```bibtex
@inproceedings{CitekeyNewInproceedings,
 author    = "Ada Lovelace",
 title     = "Early Computations: An Analytical Engine",
 booktitle = "Proceedings of the 10th International Conference on History of Computing",
 series    = "HistComp",
 year      = 2009,
 pages     = "67--75",
 publisher = "IEEE",
 address   = "Boston, MA"
}
```

## 7. Manual

Technical documentation.

```bibtex
@manual{CitekeyNewManual,
 title        = "User Guide for Quantum Computing",
 author       = "Quantum Computing Association",
 organization = "International Society for Quantum Information",
 address      = "Geneva, Switzerland",
 year         = 2022
}
```

## 8. Masters thesis

A Master's thesis.

```bibtex
@mastersthesis{CitekeyNewMastersthesis,
 author  = "Diana Prince",
 title   = "Ancient Mythologies and Modern Narratives",
 school  = "University of Athens",
 year    = 2010,
 address = "Athens, Greece",
 month   = oct
}
```

##  9. Misc

Use this type when nothing else fits. Frequently used for web pages.

```bibtex
@misc{CitekeyNewMisc,
 title        = "Exploration of Mars: A Decade of Rovers",
 author       = "European Space Agency",
 howpublished = "\url{https://www.esa.int/marsrover}",
 year         = 2020,
 note         = "Accessed: 2023-01-15"
}
```

## 10. PhdThesis

A thesis written for the PhD level degree.

```bibtex
@phdthesis{CitekeyNewPhdthesis,
 author  = "Charles Babbage",
 title   = "Development of the Analytical Engine",
 school  = "University of Cambridge",
 address = "Cambridge, UK",
 year    = 1834,
 month   = dec
}
```

## 11. Proceedings

The proceedings of a conference.

```bibtex
@proceedings{CitekeyNewProceedings,
 editor    = "George Boole and Augusta Ada King",
 title     = "Proceedings of the 24th International Conference on Logic and Mathematics",
 series    = "Advanced Studies in Pure Mathematics",
 volume    = "101",
 publisher = "Mathematical Society Press",
 address   = "Edinburgh, Scotland",
 year      = 2021
}
```

## 12. TechReport

A report published by a school or other institution, usually numbered within a series.

```bibtex
@techreport{CitekeyNewTechreport,
 title       = "Advancements in Renewable Energy Technologies",
 author = "International Energy Agency",
 institution = "IEA",
 month = "January",
 year = 2020,
 number = "IEA-TR-2020-01"
 address = "Paris, France"
```

## 13. Unpublished

A document having an author and title, but not formally published.

```bibtex
@unpublished{CitekeyNewUnpublished,
 author      = "Marie Curie",
 title       = "The Discovery of Radium",
 note        = "Unpublished manuscript",
 year        = 1902,
 month       = nov
}
```

## 14. Conference

A conference paper.

```bibtex
@conference{CitekeyNewConference,
 author      = "Alan Turing",
 title       = "Computing Machinery and Intelligence",
 booktitle   = "Proceedings of the 1st International Conference on Artificial Intelligence",
 year        = 1956,
 month       = aug,
 address     = "Dartmouth College, Hanover, NH"
}
```
