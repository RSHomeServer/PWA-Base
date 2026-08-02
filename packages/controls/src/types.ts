type ParamDefBase = {
  id: string;
  label: string;
  description?: string;
};

export type NumberParamDef = ParamDefBase & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
};

export type BooleanParamDef = ParamDefBase & {
  type: "boolean";
};

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectParamDef = ParamDefBase & {
  type: "select";
  options: SelectOption[];
};

export type TextParamDef = ParamDefBase & {
  type: "text";
};

export type ParamDef = NumberParamDef | BooleanParamDef | SelectParamDef | TextParamDef;

export type ParamValue = string | number | boolean;

export type ParamValues = Record<string, ParamValue>;
