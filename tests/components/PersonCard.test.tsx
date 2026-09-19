import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import PersonCard from "../../src/components/PersonCard/PersonCard";
import { makePerson } from "../fixtures/person";
import { renderWithRouter } from "../helpers/render";

const TMDB_PROFILE_BASE = "https://image.tmdb.org/t/p/w342";
const PLACEHOLDER_PROFILE = "/image-placeholder-vertical.jpg";

function profileImage(name: string): HTMLElement {
  return screen.getByRole("img", { name });
}

describe("<PersonCard />", () => {
  it("links to the actor route for the person id", () => {
    // Given: a person with a known id.
    const person = makePerson({ id: 42 });

    // When: the card is rendered.
    renderWithRouter(<PersonCard {...person} />);

    // Then: the card links to that actor's page.
    expect(screen.getByRole("link")).toHaveAttribute("href", "/actor/42");
  });

  describe("image sizing", () => {
    it("renders the full-size image when fromSearch is set", () => {
      // Given: a person rendered from the search results.
      const person = makePerson({
        fromSearch: true,
        original_name: "Search Person",
      });

      // When: the card is rendered.
      renderWithRouter(<PersonCard {...person} />);

      // Then: next/image receives the full poster dimensions.
      const image = profileImage("Search Person");
      expect(image).toHaveAttribute("width", "342");
      expect(image).toHaveAttribute("height", "513");
    });

    it("renders the third-size image when fromSearch is not set", () => {
      // Given: a person rendered inside a cast list.
      const person = makePerson({
        fromSearch: false,
        original_name: "Cast Person",
      });

      // When: the card is rendered.
      renderWithRouter(<PersonCard {...person} />);

      // Then: next/image receives the divided-by-three dimensions.
      const image = profileImage("Cast Person");
      expect(image).toHaveAttribute("width", "114");
      expect(image).toHaveAttribute("height", "174");
    });
  });

  describe("profile image source", () => {
    it("uses the TMDB profile path when profile_path is set", () => {
      // Given: a person with a TMDB profile path.
      const person = makePerson({
        original_name: "Photographed Person",
        profile_path: "/fixture-actor.jpg",
      });

      // When: the card is rendered.
      renderWithRouter(<PersonCard {...person} />);

      // Then: next/image optimises the remote TMDB profile image.
      expect(profileImage("Photographed Person").getAttribute("src")).toContain(
        encodeURIComponent(`${TMDB_PROFILE_BASE}/fixture-actor.jpg`),
      );
    });

    it("uses the local placeholder when profile_path is absent", () => {
      // Given: a person with no profile path.
      const person = makePerson({
        original_name: "Faceless Person",
        profile_path: "",
      });

      // When: the card is rendered.
      renderWithRouter(<PersonCard {...person} />);

      // Then: next/image falls back to the bundled placeholder.
      expect(profileImage("Faceless Person").getAttribute("src")).toContain(
        encodeURIComponent(PLACEHOLDER_PROFILE),
      );
    });
  });

  describe("character line", () => {
    it("renders the character when one is provided", () => {
      // Given: a cast member with a character name.
      const person = makePerson({ character: "Ellen Ripley" });

      // When: the card is rendered.
      renderWithRouter(<PersonCard {...person} />);

      // Then: the "as <character>" line is shown.
      expect(screen.getByText("as")).toBeInTheDocument();
      expect(screen.getByText("Ellen Ripley")).toBeInTheDocument();
    });

    it("renders no character line when character is absent", () => {
      // Given: a person with no character name.
      const person = makePerson({ character: "" });

      // When: the card is rendered.
      renderWithRouter(<PersonCard {...person} />);

      // Then: the "as" connector is not rendered at all.
      expect(screen.queryByText("as")).toBeNull();
    });
  });

  describe("display name fallback", () => {
    it("prefers original_name over name", () => {
      // Given: a person with distinct original_name and name.
      const person = makePerson({
        original_name: "Primary Original Name",
        name: "Secondary Name",
      });

      // When: the card is rendered.
      renderWithRouter(<PersonCard {...person} />);

      // Then: original_name wins.
      expect(screen.getByText("Primary Original Name")).toBeInTheDocument();
      expect(screen.queryByText("Secondary Name")).toBeNull();
    });

    it("falls back to name when original_name is absent", () => {
      // Given: a person whose original_name is blank.
      const person = makePerson({
        original_name: "",
        name: "Secondary Name",
      });

      // When: the card is rendered.
      renderWithRouter(<PersonCard {...person} />);

      // Then: name is used instead.
      expect(screen.getByText("Secondary Name")).toBeInTheDocument();
    });
  });
});
