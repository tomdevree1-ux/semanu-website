export type LeadNote = {
  id: string;
  body: string;
  version: number;
  authorName: string;
  /** Set when the note was last edited by someone other than the author. */
  editorName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadNoteVersion = {
  version: number;
  body: string;
  authorName: string;
  createdAt: string;
};
