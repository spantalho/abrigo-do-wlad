import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

type AccessibleName = string | RegExp;

export function getField(name: AccessibleName): HTMLElement {
  return screen.getByLabelText(name);
}

export function changeField(name: AccessibleName, value: string): HTMLElement {
  const field = getField(name);
  fireEvent.change(field, { target: { value } });
  return field;
}

export function chooseRadio(
  question: AccessibleName,
  option: AccessibleName,
): HTMLElement {
  const group = screen.getByRole("radiogroup", { name: question });
  const radio = within(group).getByRole("radio", { name: option });
  fireEvent.click(radio);
  return radio;
}

export async function selectField(
  question: AccessibleName,
  option: AccessibleName,
): Promise<HTMLElement> {
  const user = userEvent.setup();
  const trigger = screen.getByRole("combobox", { name: question });

  await user.click(trigger);
  const selectedOption = await screen.findByRole("option", { name: option });
  await user.click(selectedOption);

  return trigger;
}
