class MockElement {
  value = '';
  textContent = '';
  title = '';
  type = '';

  addClass(): this {
    return this;
  }

  removeClass(): this {
    return this;
  }

  empty(): this {
    return this;
  }

  createEl(): MockElement {
    return new MockElement();
  }

  createDiv(): MockElement {
    return new MockElement();
  }

  createSpan(): MockElement {
    return new MockElement();
  }

  querySelectorAll(): MockElement[] {
    return [];
  }

  addEventListener(): void {}
}

export class TAbstractFile {
  path = '';
  name = '';
  parent: TFolder | null = null;
}

export class TFile extends TAbstractFile {
  basename = '';
  extension = '';
  stat = {
    size: 0,
    mtime: 0
  };
}

export class TFolder extends TAbstractFile {
  children: Array<TFile | TFolder> = [];
}

export class MarkdownView {
  file: TFile | null = null;
  editor = {
    getCursor: () => ({ line: 0, ch: 0 }),
    replaceRange: () => undefined,
    setCursor: () => undefined
  };
}

export class Notice {
  constructor(_message: string) {}
}

export class Modal {
  protected readonly contentEl = new MockElement();

  constructor(_app: unknown) {}

  open(): void {}
}

export class Plugin {
  app: Record<string, unknown> = {};

  addCommand(): void {}

  removeCommand(): void {}

  addSettingTab(): void {}

  registerEvent(): void {}

  registerMarkdownPostProcessor(): void {}

  async loadData(): Promise<Record<string, unknown>> {
    return {};
  }

  async saveData(_data: unknown): Promise<void> {}
}

export class PluginSettingTab {
  protected readonly containerEl = new MockElement();

  constructor(_app: unknown, _plugin: unknown) {}
}

export const Platform = {
  isDesktop: true,
  isMobile: false,
  isDesktopApp: true,
  isMobileApp: false,
  isIosApp: false,
  isAndroidApp: false,
  isPhone: false,
  isTablet: false
};

export class Setting {
  constructor(_containerEl: unknown) {}

  setName(): this {
    return this;
  }

  setDesc(): this {
    return this;
  }

  setClass(): this {
    return this;
  }

  setErrorMessage(): this {
    return this;
  }

  addButton(callback: (button: {
    setButtonText: (text: string) => unknown;
    setWarning: () => unknown;
    onClick: (handler: () => unknown) => unknown;
  }) => unknown): this {
    const button = {
      setButtonText: () => button,
      setWarning: () => button,
      onClick: () => button
    };
    callback(button);
    return this;
  }

  addDropdown(callback: (dropdown: {
    addOption: (value: string, label: string) => unknown;
    setValue: (value: string) => unknown;
    onChange: (handler: (value: string) => unknown) => unknown;
  }) => unknown): this {
    const dropdown = {
      addOption: () => dropdown,
      setValue: () => dropdown,
      onChange: () => dropdown
    };
    callback(dropdown);
    return this;
  }

  addText(callback: (text: {
    inputEl: MockElement;
    setPlaceholder: (value: string) => unknown;
    setValue: (value: string) => unknown;
    onChange: (handler: (value: string) => unknown) => unknown;
  }) => unknown): this {
    const text = {
      inputEl: new MockElement(),
      setPlaceholder: () => text,
      setValue: () => text,
      onChange: () => text
    };
    callback(text);
    return this;
  }

  addSlider(callback: (slider: {
    setLimits: (min: number, max: number, step: number) => unknown;
    setDynamicTooltip: () => unknown;
    setValue: (value: number) => unknown;
    onChange: (handler: (value: number) => unknown) => unknown;
  }) => unknown): this {
    const slider = {
      setLimits: () => slider,
      setDynamicTooltip: () => slider,
      setValue: () => slider,
      onChange: () => slider
    };
    callback(slider);
    return this;
  }

  addToggle(callback: (toggle: {
    setValue: (value: boolean) => unknown;
    onChange: (handler: (value: boolean) => unknown) => unknown;
  }) => unknown): this {
    const toggle = {
      setValue: () => toggle,
      onChange: () => toggle
    };
    callback(toggle);
    return this;
  }
}
