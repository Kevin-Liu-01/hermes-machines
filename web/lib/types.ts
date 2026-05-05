export type Role = "user" | "assistant" | "system";

export type Message = {
	id: string;
	role: Role;
	content: string;
	createdAt: number;
};

export type ChatRequestBody = {
	messages: Array<{ role: Role; content: string }>;
};
