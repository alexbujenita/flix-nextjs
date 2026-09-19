import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { useRouter } from "next/router";
import { describe, expect, it, vi } from "vitest";

import RegisterPage from "../../src/components/RegisterPage/RegisterPage";
import { renderWithRouter } from "../helpers/render";
import { server } from "../msw/server";

const origin = "http://localhost:3001";
const REGISTER_URL = `${origin}/api/auth/register`;

/**
 * `renderWithRouter` always supplies a `url`, so `MemoryRouterProvider` builds
 * an isolated router rather than the `next-router-mock` singleton. Navigation
 * is therefore observed through the same router the component consumes.
 */
function RouteProbe() {
  const router = useRouter();

  return <h1>{router.asPath}</h1>;
}

function currentRoute(): string {
  return screen.getByRole("heading", { level: 1 }).textContent ?? "";
}

/**
 * The four inputs have no accessible label: each `<label>` in
 * RegisterPage.js:52-102 neither wraps its input nor carries `htmlFor`, and
 * the password field is not an ARIA textbox. Placeholder queries are the
 * closest semantic handle available and stay within the "no class-name
 * selectors" rule from tests/README.md. Recorded in docs/TEST-BUGS.md.
 */
const PLACEHOLDERS = {
  email: "Enter Email",
  firstName: "Enter Name",
  password: "Enter Password",
  surname: "Enter Surname",
} as const;

function getFields() {
  return {
    email: screen.getByPlaceholderText(PLACEHOLDERS.email),
    firstName: screen.getByPlaceholderText(PLACEHOLDERS.firstName),
    password: screen.getByPlaceholderText(PLACEHOLDERS.password),
    submit: screen.getByRole("button", { name: "Register" }),
    surname: screen.getByPlaceholderText(PLACEHOLDERS.surname),
  };
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  const fields = getFields();
  await user.type(fields.firstName, "Ada");
  await user.type(fields.surname, "Lovelace");
  await user.type(fields.email, "ada@example.com");
  await user.type(fields.password, "s3cret-pass");
  return fields;
}

describe("RegisterPage", () => {
  describe("controlled inputs", () => {
    it("renders all four empty fields and a submit button", () => {
      // Given / When: the register form renders.
      renderWithRouter(<RegisterPage />);

      // Then: every field starts empty and the submit control exists.
      const fields = getFields();
      expect(fields.firstName).toHaveValue("");
      expect(fields.surname).toHaveValue("");
      expect(fields.email).toHaveValue("");
      expect(fields.password).toHaveValue("");
      expect(fields.submit).toBeInTheDocument();
    });

    it("updates each field as the viewer types", async () => {
      // Given: the register form.
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);

      // When: the viewer fills every field.
      const fields = await fillForm(user);

      // Then: each controlled input reflects the typed value.
      expect(fields.firstName).toHaveValue("Ada");
      expect(fields.surname).toHaveValue("Lovelace");
      expect(fields.email).toHaveValue("ada@example.com");
      expect(fields.password).toHaveValue("s3cret-pass");
    });

    it("routes each input by its name attribute without cross-talk", async () => {
      // Given: the register form.
      const user = userEvent.setup();
      renderWithRouter(<RegisterPage />);
      const fields = getFields();

      // When: only the surname field is typed into.
      await user.type(fields.surname, "Byron");

      // Then: the other three fields remain untouched.
      expect(fields.surname).toHaveValue("Byron");
      expect(fields.firstName).toHaveValue("");
      expect(fields.email).toHaveValue("");
      expect(fields.password).toHaveValue("");
    });

    it("exposes the name attributes the change handler switches on", () => {
      // Given / When: the register form renders.
      renderWithRouter(<RegisterPage />);

      // Then: the name attributes match the handleChange switch cases.
      const fields = getFields();
      expect(fields.firstName).toHaveAttribute("name", "firstname");
      expect(fields.surname).toHaveAttribute("name", "surname");
      expect(fields.email).toHaveAttribute("name", "email");
      expect(fields.password).toHaveAttribute("name", "psw");
    });
  });

  describe("submission — success", () => {
    it("POSTs the field payload to /api/auth/register", async () => {
      // Given: a spy handler recording the register request.
      const user = userEvent.setup();
      const registerRequest = vi.fn();
      server.use(
        http.post(REGISTER_URL, async ({ request }) => {
          registerRequest(await request.json());
          return HttpResponse.json({ user: { id: 1 } }, { status: 201 });
        }),
      );
      renderWithRouter(<RegisterPage />);

      // When: the viewer completes and submits the form.
      const fields = await fillForm(user);
      await user.click(fields.submit);

      // Then: the payload maps surname onto lastName.
      await waitFor(() => {
        expect(registerRequest).toHaveBeenCalledWith({
          email: "ada@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
          password: "s3cret-pass",
        });
      });
    });

    it("pushes /login after a successful registration", async () => {
      // Given: the register form on the /register route.
      const user = userEvent.setup();
      renderWithRouter(
        <>
          <RegisterPage />
          <RouteProbe />
        </>,
        { url: "/register" },
      );
      expect(currentRoute()).toBe("/register");

      // When: the viewer completes and submits the form.
      const fields = await fillForm(user);
      await user.click(fields.submit);

      // Then: the router sends the new account to the login page.
      await waitFor(() => {
        expect(currentRoute()).toBe("/login");
      });
    });

    it("does not alert on a successful registration", async () => {
      // Given: an alert spy and the register form.
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      renderWithRouter(
        <>
          <RegisterPage />
          <RouteProbe />
        </>,
        { url: "/register" },
      );

      // When: the viewer completes and submits the form.
      const fields = await fillForm(user);
      await user.click(fields.submit);

      // Then: navigation happens and no alert is raised.
      await waitFor(() => {
        expect(currentRoute()).toBe("/login");
      });
      expect(alertSpy).not.toHaveBeenCalled();
    });
  });

  describe("submission — failure", () => {
    it("alerts SOMETHING WRONG and does not navigate when the request fails", async () => {
      // Given: the register endpoint returns 500.
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      server.use(
        http.post(REGISTER_URL, () =>
          HttpResponse.json({ message: "boom" }, { status: 500 }),
        ),
      );
      renderWithRouter(
        <>
          <RegisterPage />
          <RouteProbe />
        </>,
        { url: "/register" },
      );

      // When: the viewer completes and submits the form.
      const fields = await fillForm(user);
      await user.click(fields.submit);

      // Then: the viewer is alerted and kept on the register page.
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("SOMETHING WRONG");
      });
      expect(currentRoute()).toBe("/register");
    });

    it("keeps the typed values after a failed registration", async () => {
      // Given: a failing register endpoint.
      const user = userEvent.setup();
      vi.spyOn(window, "alert").mockImplementation(() => {});
      server.use(
        http.post(REGISTER_URL, () =>
          HttpResponse.json({ message: "boom" }, { status: 500 }),
        ),
      );
      renderWithRouter(<RegisterPage />, { url: "/register" });

      // When: the submission fails.
      const fields = await fillForm(user);
      await user.click(fields.submit);
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("SOMETHING WRONG");
      });

      // Then: the form is not cleared, so the viewer can retry.
      expect(fields.firstName).toHaveValue("Ada");
      expect(fields.surname).toHaveValue("Lovelace");
      expect(fields.email).toHaveValue("ada@example.com");
      expect(fields.password).toHaveValue("s3cret-pass");
    });
  });
});
