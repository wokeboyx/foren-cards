// Team members. Mock-backed; see ./README.md.
import type { Person } from "@/domain/types";
import * as mock from "./mock/backend";

/** Invite someone who isn't on Foren yet so a card can be created for them. */
export const invitePerson = (name: string, email: string): Promise<Person> =>
  mock.invitePerson(name, email);
