import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Admin, { getServerSideProps } from "../../../src/pages/admin/users";
import { createGsspContext } from "../../helpers/gssp";
import { renderWithRouter } from "../../helpers/render";

describe("admin users list render body", () => {
  it("renders one link per row, carrying the row id into the href", () => {
    renderWithRouter(
      <Admin
        count={2}
        rows={[
          { firstName: "Fixture", id: 7, lastName: "Viewer" },
          { firstName: "Second", id: 12, lastName: "Viewer" },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Found 2 users." }),
    ).toBeVisible();
    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/admin/users/7",
      "/admin/users/12",
    ]);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText(/ID: 7\./)).toHaveTextContent(
      "ID: 7. Fixture Viewer",
    );
    expect(screen.getByText(/ID: 12\./)).toHaveTextContent(
      "ID: 12. Second Viewer",
    );
  });

  it("substitutes the placeholder surname when a row omits lastName", () => {
    renderWithRouter(
      <Admin count={1} rows={[{ firstName: "Nameless", id: 3 }]} />,
    );

    expect(screen.getByRole("listitem")).toHaveTextContent(
      "ID: 3. Nameless Missing Last-Name",
    );
  });

  it("keeps an empty list and a zero count when no rows come back", () => {
    renderWithRouter(<Admin count={0} rows={[]} />);

    expect(
      screen.getByRole("heading", { name: "Found 0 users." }),
    ).toBeVisible();
    expect(screen.getByRole("list")).toBeEmptyDOMElement();
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("renders the rows the server props actually return", async () => {
    const result = await getServerSideProps(
      createGsspContext({ cookie: "JWT_TOKEN_MY_FLIX=admin-token" }),
    );

    if (!("props" in result)) {
      throw new Error("Expected getServerSideProps to return page props");
    }
    renderWithRouter(<Admin {...result.props} />);

    expect(
      screen.getByRole("heading", { name: "Found 1 users." }),
    ).toBeVisible();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/admin/users/1");
    expect(screen.getByRole("listitem")).toHaveTextContent(
      "ID: 1. Fixture Viewer",
    );
  });
});
