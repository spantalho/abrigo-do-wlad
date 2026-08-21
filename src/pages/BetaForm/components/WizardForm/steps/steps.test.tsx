import { render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  VALID_STEP_1,
  VALID_STEP_2,
  VALID_STEP_3,
  VALID_STEP_4,
  VALID_STEP_5,
  VALID_STEP_6,
  VALID_STEP_7,
  VALID_STEP_8,
  VALID_STEP_9,
  VALID_STEP_10,
} from "../../../../../test/fixtures/adoption";
import {
  changeField,
  chooseRadio,
  selectField,
} from "../../../../../test/helpers/wizard";
import type { FormData } from "../schema";
import type { FieldError } from "../useWizardForm";
import {
  Step1DadosPessoais,
  Step2Familia,
  Step3Adocao,
  Step4Moradia,
  Step5Historico,
  Step6Responsabilidades,
  Step7Termos,
  Step8Hipoteticas,
  Step9Situacoes,
  Step10Finalizacao,
} from ".";

interface StepProps {
  formData: Partial<FormData>;
  errors: FieldError;
  updateField: (field: keyof FormData, value: string | number) => void;
}

interface StepCase {
  name: string;
  Component: ComponentType<StepProps>;
  formData: Partial<FormData>;
  field: keyof FormData;
  label: RegExp;
  nextValue: string;
}

const STEP_CASES: StepCase[] = [
  {
    name: "etapa 1",
    Component: Step1DadosPessoais,
    formData: VALID_STEP_1,
    field: "nome_adotante",
    label: /Nome do adotante/,
    nextValue: "Outra pessoa candidata",
  },
  {
    name: "etapa 2",
    Component: Step2Familia,
    formData: VALID_STEP_2,
    field: "criancas",
    label: /Quantas crianças/,
    nextValue: "Uma criança de oito anos",
  },
  {
    name: "etapa 3",
    Component: Step3Adocao,
    formData: VALID_STEP_3,
    field: "motivo",
    label: /Por qual motivo/,
    nextValue: "Deseja oferecer companhia e cuidados responsáveis",
  },
  {
    name: "etapa 4",
    Component: Step4Moradia,
    formData: VALID_STEP_4,
    field: "responsavel",
    label: /principal responsável/,
    nextValue: "Outra pessoa responsável",
  },
  {
    name: "etapa 5",
    Component: Step5Historico,
    formData: VALID_STEP_5,
    field: "outros_animais",
    label: /Tem outros animais/,
    nextValue: "Um cão adulto castrado",
  },
  {
    name: "etapa 6",
    Component: Step6Responsabilidades,
    formData: VALID_STEP_6,
    field: "tempo_adaptacao",
    label: /Quanto tempo espera/,
    nextValue: "Até que o animal esteja seguro",
  },
  {
    name: "etapa 7",
    Component: Step7Termos,
    formData: VALID_STEP_7,
    field: "divulgacao",
    label: /Onde viu a divulgação/,
    nextValue: "Perfil fictício do abrigo",
  },
  {
    name: "etapa 8",
    Component: Step8Hipoteticas,
    formData: VALID_STEP_8,
    field: "gravidez",
    label: /Alguém engravidar/,
    nextValue: "O animal seguirá integrado à família",
  },
  {
    name: "etapa 9",
    Component: Step9Situacoes,
    formData: VALID_STEP_9,
    field: "perder",
    label: /Se perdesse/,
    nextValue: "Procuraria e comunicaria imediatamente",
  },
  {
    name: "etapa 10",
    Component: Step10Finalizacao,
    formData: VALID_STEP_10,
    field: "enxoval",
    label: /O que vai comprar/,
    nextValue: "Cama, comedouro, guia e identificação",
  },
];

describe.each(STEP_CASES)(
  "$name",
  ({ Component, formData, field, label, nextValue }) => {
    it("renderiza os dados atuais e permite alterar um campo representativo", () => {
      const updateField = vi.fn();
      render(
        <Component formData={formData} errors={{}} updateField={updateField} />,
      );

      expect(changeField(label, nextValue)).toBeInTheDocument();
      expect(updateField).toHaveBeenCalledWith(field, nextValue);
    });

    it("apresenta a mensagem de validação da etapa", () => {
      const message = `Mensagem de validação da ${field}`;
      render(
        <Component
          formData={formData}
          errors={{ [field]: message }}
          updateField={vi.fn()}
        />,
      );

      expect(screen.getByRole("alert")).toHaveTextContent(message);
    });

    it("mantém todos os controles associados a uma pergunta acessível", () => {
      const { container } = render(
        <Component formData={formData} errors={{}} updateField={vi.fn()} />,
      );

      container
        .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          "input[id], textarea[id]",
        )
        .forEach((control) => expect(control.labels?.length).toBeGreaterThan(0));

      screen
        .queryAllByRole("radiogroup")
        .forEach((group) => expect(group).not.toHaveAccessibleName(""));
      screen
        .queryAllByRole("combobox")
        .forEach((select) => expect(select).not.toHaveAccessibleName(""));
    });
  },
);

describe("comportamentos especializados", () => {
  it("formata o telefone e limita a entrada a onze dígitos", () => {
    const updateField = vi.fn();
    render(
      <Step1DadosPessoais
        formData={{}}
        errors={{}}
        updateField={updateField}
      />,
    );

    changeField(/Telefone/, "85999998888777");

    expect(updateField).toHaveBeenCalledWith("telefone", "(85) 99999-8888");
  });

  it.each([
    [Step2Familia, VALID_STEP_2, /Todos estão de acordo/, "Não", "acordo"],
    [Step3Adocao, VALID_STEP_3, /Atividade principal/, "Guarda", "atividade"],
    [Step4Moradia, VALID_STEP_4, /Sobre sua moradia/, "Alugada", "tipo_moradia"],
    [Step6Responsabilidades, VALID_STEP_6, /Possui carro/, "Não", "carro"],
    [Step7Termos, VALID_STEP_7, /Aceita visitas/, "Não", "visitas"],
    [
      Step10Finalizacao,
      VALID_STEP_10,
      /Concorda com o termo acima/,
      "Não",
      "termo_nao_repassar",
    ],
  ] as const)(
    "altera uma escolha pelo texto da pergunta",
    (Component, formData, question, option, field) => {
      const updateField = vi.fn();
      render(
        <Component
          formData={formData}
          errors={{}}
          updateField={updateField}
        />,
      );

      chooseRadio(question, option);

      expect(updateField).toHaveBeenCalledWith(field, option);
    },
  );

  it.each([
    [
      Step1DadosPessoais,
      VALID_STEP_1,
      /Estado Civil/,
      "Casado (a) ou União Estável",
      "estado_civil",
      "Casado/Uniao",
    ],
    [
      Step3Adocao,
      VALID_STEP_3,
      /^3\.3\.1\. Porte/,
      "Mini (até 4kgs)",
      "porte",
      "Mini",
    ],
    [
      Step4Moradia,
      VALID_STEP_4,
      /Acesso a cômodos/,
      "Somente varanda/quintal",
      "acesso",
      "Restrito",
    ],
    [
      Step6Responsabilidades,
      VALID_STEP_6,
      /Previsão de gasto mensal/,
      "entre 150,00 e 250,00",
      "gasto_mensal",
      "150-250",
    ],
  ] as const)(
    "altera um select pelo texto da pergunta",
    async (Component, formData, question, option, field, value) => {
      const updateField = vi.fn();
      render(
        <Component
          formData={formData}
          errors={{}}
          updateField={updateField}
        />,
      );

      await selectField(question, option);

      expect(updateField).toHaveBeenCalledWith(field, value);
    },
  );

  it("mantém os valores padrão de sexo e permissão da moradia selecionados", () => {
    const { unmount } = render(
      <Step3Adocao formData={{}} errors={{}} updateField={vi.fn()} />,
    );
    const sexGroup = screen.getByRole("radiogroup", { name: /Sexo/ });

    expect(
      within(sexGroup).getByRole("radio", { name: "Não importa" }),
    ).toBeChecked();
    unmount();

    render(<Step4Moradia formData={{}} errors={{}} updateField={vi.fn()} />);
    const ownerGroup = screen.getByRole("radiogroup", {
      name: /proprietário permite animais/,
    });

    expect(
      within(ownerGroup).getByRole("radio", { name: "Minha casa é própria" }),
    ).toBeChecked();
  });

  it("exibe as orientações das etapas reflexiva e final", () => {
    const { unmount } = render(
      <Step8Hipoteticas formData={{}} errors={{}} updateField={vi.fn()} />,
    );

    expect(
      screen.getByText("Responda com detalhes. Questões para reflexão."),
    ).toBeInTheDocument();
    unmount();

    render(<Step10Finalizacao formData={{}} errors={{}} updateField={vi.fn()} />);

    expect(screen.getByText("IMPORTANTE!")).toBeInTheDocument();
  });
});
