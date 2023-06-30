import { useNavigate } from "@solidjs/router";
import { type Component, Show } from "solid-js";
import { createFormControl, createFormGroup } from "solid-forms";
import { ROUTER_PATHS } from "@/router";
import { AuthService } from "@/services/authService";

const minPasswordLength = 4;

const LoginForm: Component = () => {
  const loginControl = createFormControl("", {
    required: true,
    validators: [
      (value: string) =>
        value.trim().length === 0 ? { isMissing: true } : null,
    ],
  });
  const passwordControl = createFormControl("", {
    required: true,
    validators: [
      (value: string) =>
        value.trim().length < minPasswordLength ? { isMissing: true } : null,
    ],
  });
  const form = createFormGroup({
    login: loginControl,
    password: passwordControl,
  });

  let loginInput!: HTMLInputElement;
  let passwordInput!: HTMLInputElement;
  const navigate = useNavigate();

  const log = async (e: Event) => {
    e.preventDefault();
    loginControl.markTouched(true);
    passwordControl.markTouched(true);

    if (!form.isValid) {
      return;
    }

    const { login, password } = form.value as {
      login: string;
      password: string;
    };
    try {
      await AuthService.logIn({ login, password });
      navigate(ROUTER_PATHS.game.prefix);
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <form
      onSubmit={log}
      class="h-[100vh] w-full sm:w-1/2 ml-auto p-[5vw] flex flex-col justify-center gap-y-[5vh] bg-[gray]"
    >
      <input
        ref={loginInput}
        value={loginControl.value}
        onInput={() => loginControl.setValue(loginInput.value)}
        onBlur={() => loginControl.markTouched(true)}
        classList={{
          "block border border-[silver] focus:outline-none": true,
          "border-[red]": loginControl.isTouched && !loginControl.isValid,
        }}
      />
      <Show when={loginControl.isTouched && !loginControl.isValid} />
      <input
        ref={passwordInput}
        type="password"
        value={passwordControl.value}
        onInput={() => passwordControl.setValue(passwordInput.value)}
        onBlur={() => passwordControl.markTouched(true)}
        classList={{
          "block border border-[silver] focus:outline-none": true,
          "border-[red]": passwordControl.isTouched && !passwordControl.isValid,
        }}
      />
      <Show when={passwordControl.isTouched && !passwordControl.isValid} />
      <button class="bg-white">log in</button>
    </form>
  );
};

export default LoginForm;
