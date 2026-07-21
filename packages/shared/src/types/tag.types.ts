/** A tag as returned by the API. Field names match the JSON contract documented in README.md. */
export interface Tag {
  id: string;
  name: string;
}

/** Body for POST /tags */
export interface CreateTagInput {
  name: string;
}
