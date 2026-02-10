export type RootStackParamList = {
	Home: undefined;
	CircleFlow: undefined;
	FamilyTree: undefined;
	FlipUp: undefined;
	Flags: undefined;
	LinguaFlip: undefined;
	Birthdays: undefined;
	Todo: undefined;
	Module4: undefined;
	Module5: undefined;
};

export type BirthdaysStackParamList = {
	BirthdaysTabs: undefined;
	BirthdaysEventForm:
		| { mode: "create"; date?: string }
		| { mode: "edit"; eventId: number };
};

export type BirthdaysTabParamList = {
	BirthdaysList: undefined;
	BirthdaysCalendar: undefined;
	BirthdaysSearch: undefined;
};

export type CircleFlowTabParamList = {
	CircleFlowHome: undefined;
	CircleFlowLog: { date?: string };
	CircleFlowHistory: undefined;
};

export type FamilyTreeStackParamList = {
	FamilyTreeSelect: undefined;
	FamilyTreeMain: { treeId: number };
	FamilyTreePerson:
		| { mode: "create"; treeId: number; parentId?: number }
		| { mode: "edit"; treeId: number; personId: number };
	FamilyTreeList: { treeId: number };
};

export type FlagsTabParamList = {
	FlagsBrowse: undefined;
	FlagsQuizStack: undefined;
};

export type FlagsQuizStackParamList = {
	FlagsQuizStart: undefined;
	FlagsQuizPlay: { questionCount: number; continent: string | null };
	FlagsQuizResult: { correct: number; total: number };
};

export type LinguaFlipStackParamList = {
	LLProjectSelect: undefined;
	LLTabs: { projectId: number };
	LLCardForm:
		| { projectId: number; mode: "create" }
		| { projectId: number; mode: "edit"; cardId: number };
};

export type LinguaFlipTabParamList = {
	LLReview: { projectId: number };
	LLQuizStack: { projectId: number };
	LLMistakes: { projectId: number };
};

export type LLQuizStackParamList = {
	LLQuizStart: { projectId: number };
	LLQuizPlay: { projectId: number; mode: "easy" | "medium" | "hard"; questionCount: number; tagId: number | null };
	LLQuizResult: { correct: number; total: number; mistakeCount: number };
};

export type TodoStackParamList = {
	TodoTabs: undefined;
	TodoTaskForm:
		| { mode: "create"; categoryId?: number; dueDate?: string }
		| { mode: "edit"; taskId: number };
	TodoCategoryForm:
		| { mode: "create" }
		| { mode: "edit"; categoryId: number };
};

export type TodoTabParamList = {
	TodoTasks: undefined;
	TodoCategories: undefined;
	TodoSearch: undefined;
};
