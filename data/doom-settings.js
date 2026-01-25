//region DoomPointsSettings
export class DoomPointsSettingsApp extends
  foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
  ) {

  static DEFAULT_OPTIONS = {
    id: "bf-qol-doom-settings",
    tag: "form",
    window: {
      title: "Doom Points",
      resizable: true
    }
  };

  static PARTS = {
    form: {
      template: "modules/bf-qol/templates/doom-points-settings.hbs"
    }
  }

  async _prepareContext() {
    const combat = game.combat;

    return {
      doomPoint: game.settings.get("bf-qol", "doomPoint"),
      spent: combat?.getFlag("bf-qol", "doomSpent") ?? 0,
      max: combat?.getFlag("bf-qol", "doomMax") ?? 0,
      effects: game.settings.get("bf-qol", "doomEffects")
    };
  }

  //Listener change in the form
  async _activateListeners(html) {
    super._activateListeners(html);

    html.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", this._onClickAction.bind(this));
    });

  }

  async _onClickAction(event) {
    event.preventDefault();
    const id = event.target.dataset.id;
    const action = event.target.dataset.action;


    switch (action) {
      case "add-effect": {
        return this.openEffectDialog();
      }
      case "delete-effect": {
        return this.deleteEffect(id, event);
      }
      case "edit-effect": {
        const effect = this.getEffects().find(f => f.id === id);
        return this.openEffectDialog(effect);
      }
      case "save":
        return this._onSave();
      case "close":
        return this.close();
    }

  }

  async _onSave() {
    const root = this.element;
    const doomPoint = root.querySelector('[name="doomPoint"]').checked;
    const spent = Number(root.querySelector('[name="spent"]').value);
    const max = Number(root.querySelector('[name="max"]').value);

    await game.settings.set("bf-qol", "doomPoint", doomPoint);

    const combat = game.combat;
    if (combat) {
      await combat.setFlag("bf-qol", "doomSpent", Math.clamp(spent, 0, max));
      await combat.setFlag("bf-qol", "doomMax", Math.max(0, max));
    }

    ui.combat.render(true);
    this.close();
  }

  getDataEffect() {
    return {
      effects: game.settings.get("bf-qol", "doomEffects")
    };
  }

  getEffects() {
    return game.settings.get("bf-qol", "doomEffects");
  }

  async deleteEffect(id) {
    const updated = this.getEffects().filter(f => f.id !== id);
    await game.settings.set("bf-qol", "doomEffects", updated);
    //new DoomPointsSettingsApp().render(true);
    this.render(false);
  }

  openEffectDialog(effect = null) {
    new EffectFlagDialog(effect, this).render(true);
  }

}

//Effect Dialog
class EffectFlagDialog extends
  foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
  ) {

  constructor(effect, parent) {
    super(effect ?? []);
    console.log(effect);
    this.effect = effect;
    this.parent = parent;
  }

  static DEFAULT_OPTIONS = {
    tag: "form",
    width: 400,
    window: {
      title: "Doom Effect",
      resizable: true
    }
  };

  static PARTS = {
    form: {
      template: "modules/bf-qol/templates/effect-flag-dialog.hbs"
    }
  }

  async _prepareContext() {
    return {
      description: this.effect?.description ?? "",
      onePerEncounter: this.effect?.onePerEncounter ?? false
    };
  }

  getData() {
    return {
      description: this.effect?.description ?? "",
      onePerEncounter: this.effect?.onePerEncounter ?? false
    };
  }

  async _onClickAction(event) {
    event.preventDefault();

    const action = event.target.dataset.action;

    switch (action) {
      case "save-effect":
        return this._onSave();
      case "close-effect":
        return this.close();
    }

  }

  async _onSave(event, formData) {
    console.log("...Saving Effect");
    const effects = game.settings.get("bf-qol", "doomEffects");
    const root = this.element;

    const formDescription = root.querySelector('[name="description"]').value;
    const formOnePerEncounter = root.querySelector('[name="onePerEncounter"]').checked;

    if (this.effect) {
      const f = effects.find(f => f.id === this.effect.id);
      f.description = formDescription;
      f.onePerEncounter = formOnePerEncounter;
    } else {
      effects.push({
        id: foundry.utils.randomID(),
        description: formDescription,
        onePerEncounter: formOnePerEncounter
      });
    }

    await game.settings.set("bf-qol", "doomEffects", effects);
    console.log("Saved");
    this.parent.render();
    this.close();
  }
}
//endregion

//region DoomPointsViewUse
export class DoomPointsViewUse extends
  foundry.applications.api.HandlebarsApplicationMixin(
    foundry.applications.api.ApplicationV2
  ) {

  static DEFAULT_OPTIONS = {
    id: "bf-qol-doom-view-use",
    tag: "form",
    window: {
      title: "Doom Points Effects",
      resizable: true
    }
  };

  static PARTS = {
    form: {
      template: "modules/bf-qol/templates/doom-points-use-view.hbs"
    }
  }

  async _prepareContext() {
    const combat = game.combat;
    const effects = game.settings.get("bf-qol", "doomEffects");
    const used = combat?.getFlag("bf-qol", "effects_used") ?? {};

    const enriched = effects.map(e => ({
      ...e,
      state: used[e.id] ?? (e.onePerEncounter ? 1 : -1) // fallback
    }));

    return {
      doomPoint: game.settings.get("bf-qol", "doomPoint"),
      spent: combat?.getFlag("bf-qol", "doomSpent") ?? 0,
      max: combat?.getFlag("bf-qol", "doomMax") ?? 0,
      effects: enriched,
      isGM: game.user.isGM,
    };
  }



  //Listener change in the form
  async _activateListeners(html) {
    super._activateListeners(html);

    html.querySelectorAll("[data-action]").forEach(el => {
      el.addEventListener("click", this._onClickAction.bind(this));
    });

  }

  async _onClickAction(event) {
    event.preventDefault();
    const id = event.target.dataset.id;
    const action = event.target.dataset.action;

    switch (action) {
      case "use-effect": {
        return this._onUse(id, event.target);
      }
      case "close":
        return this.close();
    }

  }

  getEffects() {
    return game.settings.get("bf-qol", "doomEffects");
  }

  async _onUse(id, element) {

    const combat = game.combat;
    if (!combat) return;

    let spent = combat.getFlag("bf-qol", "doomSpent") ?? 0;
    let max = combat.getFlag("bf-qol", "doomMax") ?? 0;

    if (spent == max)
      return ui.notifications.warn("No available Doom Points.");

    const used = combat.getFlag("bf-qol", "effects_used") ?? {};

    if (used[id] === 0)
      return ui.notifications.warn("Used for this combat.");

    // Get effects values by id
    const effects = game.settings.get("bf-qol", "doomEffects") ?? [];
    const effect = effects.find(e => e.id === id);

    if (!effect)
      return console.warn("Effect config missing for id:", id);

    if (used[id] === 1) used[id] = 0;

    await combat.setFlag("bf-qol", "doomSpent", Math.clamp(spent + 1, 0, max));
    await combat.setFlag("bf-qol", "effects_used", used);

    // Animation
    element.classList.add("spend-anim");
    setTimeout(() => element.classList.remove("spend-anim"), 400);

    // Send Chat message
    ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ alias: "Doom Tracker" }),
      content: `
      <div class="bf-doom-msg">
        <strong>Doom Point used for:</strong>
        <div>${effect.description}</div>
      </div>
    `
    });

    ui.combat.render();
    this.close();
  }


}