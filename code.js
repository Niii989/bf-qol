import { DoomPointsSettingsApp } from "./data/doom-settings.js";
import { DoomPointsViewUse } from "./data/doom-settings.js";

// Verify if LibWrapper is installed
Hooks.once('ready', () => {
  if (!game.modules.get('lib-wrapper')?.active && game.user.isGM) {
    ui.notifications.error("BF QOL requires the 'libWrapper' module. Please install and activate it.");
  }
  if (!game.modules.get("socketlib")?.active && game.user.isGM) {
    ui.notifications.error("BF QOL requires the 'SocketLib' module. Please install and activate it.");
  }

});

import { weaponOptionTemplates } from "./data/weapon-option-templates.js";

//Module Settings
function registerSettings() {
  const MODULE_ID = "bf-qol";

  game.settings.register(MODULE_ID, "activityTooltip", {
    name: "Enable Activity Tooltip on Actor Main Tab",
    hint: "Shows an activity description when you hover the activity in the Actor Main Tab.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register(MODULE_ID, "autoConcentration", {
    name: "Enable Auto-Concentration Effect",
    hint: "Activities with the Concentration tag will automatically apply the effect.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register(MODULE_ID, "autoDeleteConcentrationEffects", {
    name: "Enable Auto-Delete Concentration Effects",
    hint: "Automatically deletes linked activity effects when their concentration effect is removed.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register(MODULE_ID, "autoReaction", {
    name: "Enable Reaction Effect",
    hint: "Automatically applies a Reaction effect whenever the actor uses an activity outside of their turn.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register(MODULE_ID, "autoApplyActivityEffects", {
    name: "Enable Auto-Apply Linked Activity Effects",
    hint: "Automatically applies linked activity effects to the targeted or selected actors.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register(MODULE_ID, "saveConcentration", {
    name: "Enable CON Save Message",
    hint: "Shows a CON Save Message when actor is Concentrating and takes damage.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });

  game.settings.register(MODULE_ID, "weaponOptions", {
    name: "Enable Weapon Options Activities for PC",
    hint: "Add and delete Weapon Options Activites from a Weapon in a PC Sheet.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean
  });
  //Doom points Menu
  game.settings.register(MODULE_ID, "doomPoint", {
    name: "Enable Doom Point Tracker",
    hint: "Shows a Doom Points Tracker in the Combat Encounters Tab.",
    scope: "world",
    config: false,
    default: true,
    type: Boolean
  });

  game.settings.register("bf-qol", "doomEffects", {
    scope: "world",
    config: false,
    type: Array,
    default: [] // [{id, description, onePerEncounter}]
  });

  game.settings.registerMenu(MODULE_ID, "doomPointsMenu", {
    name: "Doom Points",
    label: "Configure Doom Points",
    hint: "Open the Doom Points configuration window.",
    icon: "fas fa-skull",
    type: DoomPointsSettingsApp,
    restricted: true
  });

}

Hooks.once("init", () => {
  registerSettings();
});

function bfQolIsPrimaryGM() {
  const activeGMs = game.users.filter(user => user.active && user.isGM);
  return activeGMs.length && game.user.id === activeGMs.sort((a, b) => a.id.localeCompare(b.id))[0].id;
}

function bfQolGetActivityEffects(activity) {
  return activity?.system?.effects?.map(data => data.effect).filter(effect => effect) ?? [];
}

function bfQolEffectHasDuration(effectData) {
  const duration = effectData.duration ?? {};
  return ["seconds", "rounds", "turns"].some(key => Number(duration[key]) > 0);
}

function bfQolDurationToSeconds(duration) {
  const value = Number(duration?.value);
  const unit = duration?.unit ?? duration?.units;
  if (!value || !unit) return null;

  const unitToSeconds = {
    turn: 6,
    round: 6,
    minute: 60,
    hour: 3600,
    day: 86400,
    month: 2592000,
    year: 31536000
  };

  const multiplier = unitToSeconds[unit];
  return multiplier ? value * multiplier : null;
}

function bfQolGetFallbackEffectDuration(activity) {
  const itemDuration = activity?.item?.system?.duration;
  const activityDuration = activity?.duration;
  const seconds = bfQolDurationToSeconds(itemDuration) ?? bfQolDurationToSeconds(activityDuration);
  if (!seconds) return null;

  return {
    seconds,
    startTime: game.time.worldTime
  };
}

function bfQolGetActivityEffectTargetUuids(message) {
  const uuids = new Set();

  for (const target of message?.getFlag(game.system.id, "targets") ?? []) {
    if (target.uuid) uuids.add(target.uuid);
  }

  if (!uuids.size) {
    for (const token of game.user.targets) {
      if (token.actor?.uuid) uuids.add(token.actor.uuid);
    }
  }

  if (!uuids.size) {
    for (const token of canvas.tokens?.controlled ?? []) {
      if (token.actor?.uuid) uuids.add(token.actor.uuid);
    }
  }

  return Array.from(uuids);
}

async function bfQolGetActorFromUuid(uuid) {
  const document = await fromUuid(uuid);
  return document?.documentName === "Actor" ? document : document?.actor;
}

async function bfQolApplyEffectToActor(effect, actor, activity, messageFlags = {}) {
  if (!effect || !actor) return;
  if (!game.user.isGM && !actor.isOwner) return;

  const concentrationItemUuid = activity?.item?.system?.tags?.has("concentration")
    ? activity.item.uuid
    : null;

  const effectFlags = {
    flags: {
      [game.system.id]: {
        scaling: messageFlags.scaling,
        spellSlot: messageFlags.spellSlot
      }
    }
  };

  const durationUpdate = bfQolEffectHasDuration(effect.toObject())
    ? null
    : bfQolGetFallbackEffectDuration(activity);

  const existingEffect = actor.effects.find(actorEffect => actorEffect.origin === effect.uuid);
  if (existingEffect) {
    const durationData = durationUpdate
      ? { duration: durationUpdate }
      : (effect.constructor.getInitialDuration?.() ?? {});
    const updateData = foundry.utils.mergeObject(
      {
        disabled: false,
        ...durationData
      },
      effectFlags
    );
    if (concentrationItemUuid) {
      updateData.flags ??= {};
      updateData.flags["bf-qol"] ??= {};
      updateData.flags["bf-qol"].concentrationItemUuid = concentrationItemUuid;
    }
    return existingEffect.update(updateData);
  }

  const effectData = foundry.utils.mergeObject(
    {
      ...effect.toObject(),
      disabled: false,
      transfer: false,
      origin: effect.uuid
    },
    effectFlags
  );
  delete effectData._id;

  if (concentrationItemUuid) {
    effectData.flags ??= {};
    effectData.flags["bf-qol"] ??= {};
    effectData.flags["bf-qol"].concentrationItemUuid = concentrationItemUuid;
  }

  if (durationUpdate) {
    effectData.duration = {
      ...(effectData.duration ?? {}),
      ...durationUpdate
    };
  }

  return actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
}

async function bfQolApplyActivityEffects({ activityUuid, targetUuids, scaling, spellSlot }) {
  const activity = await fromUuid(activityUuid);
  const effects = bfQolGetActivityEffects(activity);
  if (!activity || !effects.length || !targetUuids?.length) return;

  const messageFlags = { scaling, spellSlot };
  for (const uuid of targetUuids) {
    const actor = await bfQolGetActorFromUuid(uuid);
    if (!actor) continue;

    for (const effect of effects) {
      try {
        await bfQolApplyEffectToActor(effect, actor, activity, messageFlags);
      } catch (err) {
        Hooks.onError("bf-qol.bfQolApplyEffectToActor", err, { notify: "warn", log: "warn" });
      }
    }
  }
}

// Generates Socket with Socketlib to create effects in NPCs by Players
let bfQolSocket = null;

Hooks.once("socketlib.ready", () => {
  console.log("SOCKETLIB READY");

  bfQolSocket = socketlib.registerModule("bf-qol");

  bfQolSocket.register("applyActivityEffects", async (payload) => {

    await bfQolApplyActivityEffects(payload);
  });
});

// Add Warning Template to a List of BlackFlag Dialogs
Hooks.once("init", () => {

  const dialogs = {
    "BlackFlag.applications.activity.ActivityActivationDialog":
      BlackFlag.applications.activity.ActivityActivationDialog,
    "BlackFlag.applications.activity.SummonActivationDialog":
      BlackFlag.applications.activity.SummonActivationDialog,
    "BlackFlag.applications.dice.BasicRollConfigurationDialog":
      BlackFlag.applications.dice.BasicRollConfigurationDialog,
    "BlackFlag.applications.dice.DamageRollConfigurationDialog":
      BlackFlag.applications.dice.DamageRollConfigurationDialog,
  };

  for (const [path, DialogClass] of Object.entries(dialogs)) {
    //Add new template to dialogs
    const parts = DialogClass.PARTS;
    DialogClass.PARTS = {
      bf_qol_warning: {
        template: "modules/bf-qol/templates/activity-activation-warning.hbs"
      },
      ...parts
    };

    libWrapper.register("bf-qol",
      `${path}.prototype._preparePartContext`, async function (wrapped, partId, context, options) {
        context = await wrapped(partId, context, options);

        if (partId === "bf_qol_warning") {
          // Concentration
          context.concentrationNote = this.config.concentrationNote;
          context.concentration = !!this.config.concentration;

          // Reaction
          context.useReaction = !!this.config.useReaction ?? true; // default true
          context.reactionUsed = !!this.config.reactionUsed;
          context.reaction = !!this.config.reaction;
        }
        return context;
      },
      "WRAPPER"
    );
  }

});

// region Doom Points Tracker

Hooks.on("createCombat", async (combat) => {
  if (game.user.isGM) {
    const effects = game.settings.get("bf-qol", "doomEffects");

    const data = {};
    for (const e of effects) {
      data[e.id] = e.onePerEncounter ? 1 : -1;
    }

    await combat.setFlag("bf-qol", "effects_used", data);
  }
});

Hooks.on("updateSetting", async (setting) => {
  if (setting.key !== "bf-qol.doomEffects") return;

  const effects = setting.value;

  for (const combat of game.combats) {
    const used = combat.getFlag("bf-qol", "effects_used") ?? {};

    for (const e of effects) {
      if (!(e.id in used)) {
        used[e.id] = e.onePerEncounter ? 1 : -1;
      }
    }

    await combat.setFlag("bf-qol", "effects_used", used);
  }
});

Hooks.on("renderCombatTracker", (app, html) => {
  let container = html.querySelector(".bf-qol-doom");

  const doomPoint = game.settings.get("bf-qol", "doomPoint");
  if (!doomPoint) {
    if (container) container.remove();
    return;
  }

  const combat = game.combat;
  if (!combat) {
    if (container) container.remove();
    return;
  }

  const isGM = game.user.isGM;
  const doomSpent = combat.getFlag("bf-qol", "doomSpent") ?? 0;
  const doomMax = combat.getFlag("bf-qol", "doomMax") ?? 0;

  //Update Tracker if exists
  if (container) {
    container.querySelector(".bf-qol-doom-value").textContent = `${doomMax - doomSpent} / ${doomMax}`;
    return;
  }

  //If Doom Points Tracker doesn't exists, create it.

  container = document.createElement("div");
  container.className = "bf-qol-doom black-flag";

  container.innerHTML = `
    ${isGM ?
      `<button class="bf-qol-doom-btn"
        data-tooltip="Spend Doom Point"
        data-tooltip-class="black-flag bf-qol-tooltip">
        <i class="fas fa-skull"></i>
      </button>` :
      `<button class="bf-qol-doom-btn"
        data-tooltip="See Doom Point Effects"
        data-tooltip-class="black-flag bf-qol-tooltip">
        <i class="fas fa-skull"></i>
      </button>`}
    Doom Points: <span class="bf-qol-doom-value">${doomMax - doomSpent} / ${doomMax}</span>
    ${isGM ?
      `<button class="bf-qol-doom-settings" data-tooltip="Doom Points Settings">
        <i class="fas fa-cog"></i>
      </button>` : ""}
  `;

  html.querySelector("header")?.after(container);

  // Open View Use Doom Points
  container.querySelector(".bf-qol-doom-btn")
    .addEventListener("click", () => {
      new DoomPointsViewUse().render(true);
    });

  // Open Doom Point Settings
  if (game.user.isGM) {
    container.querySelector(".bf-qol-doom-settings")
      .addEventListener("click", () => {
        new DoomPointsSettingsApp().render(true);
      });
  }
});


// endregion




//region Reaction Tracking

//Create reaction used effect
Hooks.on("blackFlag.preActivateActivity", async (activity) => {
  const autoReaction = game.settings.get("bf-qol", "autoReaction");
  if (!autoReaction) return;

  const combat = game.combat;
  if (!combat) return; // Only works if combat is active

  const actor = activity.actor;
  if (!actor) return;

  // Ignore Legendary or Free actions
  if (activity.activation?.type === "legendary" || activity.activation?.type === "free") return;

  // Check if it's outside actor's turn
  const currentCombatant = combat.combatant;
  if (currentCombatant?.actor?.id === actor.id) return;

  const effectName = "Reaction Used";
  const existing = actor.effects.find(e => e.name === effectName);

  if (!existing) {
    const effectData = {
      name: "Reaction Used",
      icon: "modules/bf-qol/artwork/clockwise-rotation.svg",
      origin: activity.item?.uuid ?? actor.uuid,
      duration: { rounds: 2 },
      flags: { "bf-qol": { reaction: true } }
    };
    await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  }

});

// Remove the effect at the start of actor's turn
Hooks.on("updateCombat", async (combat, update, options, userId) => {
  if (!("turn" in update)) return;
  const combatant = combat.combatant;
  if (!combatant?.actor) return;

  const effect = combatant.actor.effects.find(e => e.name === "Reaction Used");
  if (effect) await effect.delete();
});

// Clean up when combat ends
Hooks.on("deleteCombat", async (combat) => {
  for (const c of combat.combatants) {
    const actor = c.actor;
    if (!actor) continue;
    const effect = actor.effects.find(e => e.name === "Reaction Used");
    if (effect) await effect.delete();
  }
});
//endregion

//region Linked Activity Effects
Hooks.once("init", () => {
  libWrapper.register(
    "bf-qol",
    "BlackFlag.applications.components.EffectApplicationElement.prototype._applyEffectToActor",
    async function (wrapped, effect, actor) {

      const activity = this.message?.getAssociatedActivity?.();

      const durationUpdate = activity && !bfQolEffectHasDuration(effect.toObject())
        ? bfQolGetFallbackEffectDuration(activity)
        : null;

      const caster = this.message?.getAssociatedActor?.();

      const item = activity?.item;

      const concentrationItemUuid =
        item?.system?.tags?.has("concentration")
          ? item.uuid
          : null;

      if (!durationUpdate && !concentrationItemUuid) {
        return wrapped(effect, actor);
      }

      const effectData = effect.toObject();

      // Duration
      if (durationUpdate) {
        effectData.duration = {
          ...(effectData.duration ?? {}),
          ...durationUpdate
        };
      }

      // Flag for Concentration Effects
      if (concentrationItemUuid) {
        effectData.flags ??= {};
        effectData.flags["bf-qol"] ??= {};

        effectData.flags["bf-qol"].concentrationItemUuid = concentrationItemUuid;
      }

      const timedEffect = new effect.constructor(effectData, {
        parent: effect.parent
      });

      return wrapped(timedEffect, actor);
    },
    "WRAPPER"
  );
});

Hooks.on("blackFlag.postActivateActivity", async (activity, activationConfig, results) => {
  const autoApplyActivityEffects = game.settings.get("bf-qol", "autoApplyActivityEffects");
  if (!autoApplyActivityEffects) return;

  const effects = bfQolGetActivityEffects(activity);
  if (!effects.length) return;

  const message = results?.message;
  const targetUuids = bfQolGetActivityEffectTargetUuids(message);
  if (!targetUuids.length) return;

  const payload = {
    action: "applyActivityEffects",
    activityUuid: activity.uuid,
    targetUuids,
    scaling: message?.getFlag(game.system.id, "scaling"),
    spellSlot: message?.getFlag(game.system.id, "spellSlot")
  };

  if (game.user.isGM) {
    await bfQolApplyActivityEffects(payload);
  } else {
    await bfQolSocket.executeAsGM("applyActivityEffects", payload);
  }
});

//endregion

//region Concentration
Hooks.on("blackFlag.preActivateActivity", async (activity, activationConfig) => {
  //Check if activity requires concentration, checks if actor is concentrating and render message if wants to replace concentration
  activationConfig.concentration = false;
  const actor = activity.actor;
  if (!actor) return;

  if (!activity.duration?.concentration) return;

  const existing = actor.effects.find(e => e.name?.startsWith("Concentrating"));
  if (!existing) return;

  if (existing) {
    activationConfig.concentration = true;
    let previousName = "";
    if (existing && existing.name?.startsWith("Concentrating: ")) {
      previousName = existing.name.replace("Concentrating: ", "");
    } else {
      previousName = "another spell or effect";
    }
    const warningHTML = `
      ⚠️ Already concentrating on <em>${previousName}</em>. Casting <strong>${activity.item.name}</strong> will replace it.
    `;
    activationConfig.concentrationNote = warningHTML;
  }
});

//Auto create Concentrating effect if activity has concentration marked
Hooks.on("createChatMessage", async (message) => {
  const autoConcentration = game.settings.get("bf-qol", "autoConcentration");
  if (!autoConcentration) return;

  //Only execute one time, avoid duplicate effect
  if (message.author.id !== game.user.id) return;

  //Verify if spell is used and requires Concentration
  const item = message.getAssociatedItem();

  if (!item || item.type !== "spell") return;

  const actor = message.getAssociatedActor();
  if (!actor || !item.system?.tags?.has("concentration")) return;

  //Effect Name
  const effectName = `Concentrating: ${item.name}`;

  //Concentrating Effect duration, convert to seconds
  const durationValue = parseFloat(item.system.duration?.value) || 1;
  const durationUnit = item.system.duration?.unit || "minute";

  const unitToSeconds = {
    round: 6,
    minute: 60,
    hour: 3600,
    day: 86400
  };

  const seconds = durationValue * (unitToSeconds[durationUnit] || 60);

  //Delete previous Concentration
  const existing = actor.effects.find(e => e.name?.startsWith("Concentrating"));
  if (existing) await existing.delete();

  //Create new effect
  const effectData = {
    name: effectName,
    icon: "systems/black-flag/artwork/statuses/concentrating.svg",
    origin: item.uuid,
    duration: { seconds: seconds },
    changes: [],
    flags: {
      "black-flag": {
        concentrationSource: item.name
      },
      "bf-qol": {
        concentrationItemUuid: item.uuid
      }
    }
  };

  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
});

// Delete all effects relationated with concentration
Hooks.on("deleteActiveEffect", async (effect, options, userId) => {
  const autoDeleteConcentrationEffects = game.settings.get("bf-qol", "autoDeleteConcentrationEffects");
  if (!autoDeleteConcentrationEffects) return;

  // Only Concentration
  if (!effect.flags?.["black-flag"]?.concentrationSource) return;

  // Only one client should clean linked effects.
  if (!bfQolIsPrimaryGM()) return;

  const concentrationItemUuid =
    effect.flags?.["bf-qol"]?.concentrationItemUuid;

  if (!concentrationItemUuid) return;

  // Search all actors in Scene
  for (const actor of game.actors.contents) {

    const linkedEffects = actor.effects.filter(e =>
      e.flags?.["bf-qol"]?.concentrationItemUuid === concentrationItemUuid
    );

    if (!linkedEffects.length) continue;

    await actor.deleteEmbeddedDocuments(
      "ActiveEffect",
      linkedEffects.map(e => e.id)
    );
  }

  // Verify Concentration Flag = Effect FLag
  for (const scene of game.scenes.contents) {
    for (const token of scene.tokens.contents) {

      const actor = token.actor;
      if (!actor) continue;

      const linkedEffects = actor.effects.filter(e =>
        e.flags?.["bf-qol"]?.concentrationItemUuid === concentrationItemUuid
      );

      if (!linkedEffects.length) continue;

      await actor.deleteEmbeddedDocuments(
        "ActiveEffect",
        linkedEffects.map(e => e.id)
      );
    }
  }
});

//Auto generate Message if actor takes damage
Hooks.on("preUpdateActor", async (actor, updates, options, userId) => {
  const saveConcentration = game.settings.get("bf-qol", "saveConcentration");
  if (!saveConcentration) return;

  //if (!game.user.isGM) return;

  const hpChange = foundry.utils.getProperty(updates, "system.attributes.hp.value");
  if (hpChange === undefined) return;

  const prevHP = actor.system.attributes.hp.value;
  const newHP = updates.system?.attributes?.hp?.value ?? prevHP;
  const damageTaken = prevHP - newHP;

  //Verify if has taken damage
  if (damageTaken <= 0) return;

  //Verify if actor has concentrating effect
  const hasConcentration = actor.effects.find(e => e.name.toLowerCase().includes("concentrating"));
  if (!hasConcentration) return;

  const dc = Math.max(10, Math.floor(damageTaken / 2));
  const actorId = actor.id;

  //Get users Owner of actor to show save to GM and Owners
  const gmUsers = ChatMessage.getWhisperRecipients("GM").map(u => u.id);
  const ownerUsers = actor?.ownership
    ? Object.entries(actor.ownership)
      .filter(([id, level]) => level >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
      .map(([id]) => id)
    : [];
  const whisperTo = [...new Set([...gmUsers, ...ownerUsers])];

  const chatContent = `
  <div>
    <div class="black-flag chat-card activity">
    <ul class="menu">
      <li>
				<button type="button" class="light-button concentration-save-button" data-dc="${dc}" data-ability="constitution" data-action="rollSave" data-visibility="all" data-actor-id="${actor.id}">
					<i class="fa-solid fa-shield-heart" inert=""></i>
        <span>
					<span class="visible-dc">DC ${dc} CON Save</span>
					<span class="hidden-dc">CON Save</span>
				</span>
				</button>
			</li>

    </ul>
    </div>
  </div>
  `;

  //BlackFlag.documents.BlackFlagChatMessage.create({
  ChatMessage.create({
    content: chatContent,
    speaker: ChatMessage.getSpeaker({ actor }),
    flags: {
      "bf-qol-concentrating": {
        displayChallenge: true
      }
    },
    whisper: whisperTo
  });
});

//Enable Roll button
Hooks.on("renderChatMessageHTML", (message, html, data) => {
  const saveConcentration = game.settings.get("bf-qol", "saveConcentration");
  if (!saveConcentration) return;

  if (message.flags["bf-qol-concentrating"]?.displayChallenge) {
    html.setAttribute("data-display-challenge", "");
  }

  const buttons = html.querySelectorAll(".concentration-save-button");

  buttons.forEach((button) => {
    button.addEventListener("click", async (event) => {
      const actorId = button.dataset.actorId;
      const dc = parseInt(button.dataset.dc, 10);

      const actor = game.actors.get(actorId);
      if (!actor) return;

      const config = {
        ability: "constitution",
        type: "save",
        chatMessage: true,
        target: dc
      };

      actor.rollAbilitySave(config);
    });
  });
});

//region Weapon Options
//Add weapon options activities
Hooks.on("updateItem", async (item, updateData, options, userId) => {
  if (options.bfQolWeaponOptions) return;
  if (game.user.id !== userId) return;

  const weaponOptions = game.settings.get("bf-qol", "weaponOptions");
  if (!weaponOptions) return;

  if (item.type !== "weapon") return;

  // Check if the item is on a player character sheet
  const actor = item.actor;
  if (!actor) return;
  if (actor.type !== "pc") return;

  const itemOptions = foundry.utils.getProperty(updateData, "system.options") ?? item.system.options ?? [];
  const currentActivities = foundry.utils.duplicate(item.toObject?.().system?.activities ?? {});

  let updated = false;
  const activityUpdates = {};
  const idsToDelete = new Set();
  const existingOptions = new Set();

  for (const [id, act] of Object.entries(currentActivities)) {
    const option = act.flags?.["bf-qol"]?.activity;
    if (!weaponOptionTemplates[option]) continue;

    if (existingOptions.has(option)) {
      idsToDelete.add(id);
      updated = true;
      continue;
    }

    existingOptions.add(option);
  }

  // Add weapon options Activities if marked
  for (const option of itemOptions) {
    const template = weaponOptionTemplates[option];
    if (!template) continue;

    if (!existingOptions.has(option)) {
      const activity = foundry.utils.duplicate(weaponOptionTemplates[option]);
      const id = foundry.utils.randomID();
      activity._id = id;
      activityUpdates[`system.activities.${id}`] = activity;
      existingOptions.add(option);
      updated = true;
    }
  }

  // Remove Weapon Options Activites if not marked
  for (const [id, act] of Object.entries(currentActivities)) {
    const option = act.flags?.["bf-qol"]?.activity;
    if (!weaponOptionTemplates[option]) continue;

    if (!itemOptions.includes(option)) {
      idsToDelete.add(id);
      updated = true;
    }
  }

  // Update Item
  if (updated) {
    for (const id of idsToDelete) {
      activityUpdates[`system.activities.-=${id}`] = null;
    }
    await item.update(activityUpdates, { bfQolWeaponOptions: true });
  }
});

//region Activity Tooltip for Main TAB

Hooks.once("ready", () => {
  if (game.release?.generation >= 13) {
    Hooks.on("renderApplicationV2", async (app, html) => {

      const activityTooltip = game.settings.get("bf-qol", "activityTooltip");
      if (!activityTooltip) return;

      if (!(app.document instanceof Actor)) return; // Only ActorSheets
      const rows = $(html).find("tr[data-activity][data-activity-id]").toArray();

      for (const element of rows) {
        if (element.dataset.tooltipReady) continue;
        element.dataset.tooltipReady = "true";

        const { activity: activityUuid, activityId } = element.dataset;
        if (!activityUuid && !activityId) continue;

        let itemDoc = null;
        if (activityUuid) {
          try {
            itemDoc = await fromUuid(activityUuid);
          } catch (err) {
            console.warn("UUID not resolved:", activityUuid, err);
          }
        }
        if (!itemDoc && activityId) {
          itemDoc = app.actor.items.get(activityId);
        }
        if (!itemDoc) continue;

        //enrich description
        const rawDescription = itemDoc.description?.trim() || itemDoc.parent?.description?.value || "";
        const enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(rawDescription, {
          secrets: false,
          async: true,
          relativeTo: itemDoc.parent.parent,
          rollData: itemDoc.parent.parent.getRollData()
        });

        const context = {
          item: {
            img: itemDoc.parent?.parent?.img,
            name: itemDoc.parent?.parent?.name
          },
          activity: {
            img: itemDoc.img,
            name: itemDoc.name
          },
          description: enrichedDescription,
          tags: Array.from((itemDoc.parent.parent.system.chatTags ?? itemDoc.parent.chatTags).entries())
            .map(([key, label]) => ({ key, label }))
            .filter(t => t.label)
        };

        const tooltipHtml = await foundry.applications.handlebars.renderTemplate(
          "modules/bf-qol/templates/activity-tooltip.hbs",
          context
        );


        element.setAttribute("data-tooltip", tooltipHtml);
        element.setAttribute("data-tooltip-direction", "RIGHT");
        element.setAttribute("data-tooltip-class", "bf-qol-tooltip");
        element.dataset.activityTooltipSet = "true";
      }
    });

  } else {
    Hooks.on("renderActorSheet", async (app, html) => {
      const activityTooltip = game.settings.get("bf-qol", "activityTooltip");
      if (!activityTooltip) return;

      const rows = html.find("tr[data-activity][data-activity-id]").toArray();

      for (const element of rows) {
        if (element.dataset.tooltipReady) continue;
        element.dataset.tooltipReady = "true";

        const { activity: activityUuid, activityId } = element.dataset;
        if (!activityUuid && !activityId) continue;

        let itemDoc = null;
        if (activityUuid) {
          try {
            itemDoc = await fromUuid(activityUuid);
          } catch (err) {
            console.warn("UUID not resolved:", activityUuid, err);
          }
        }
        if (!itemDoc && activityId) {
          itemDoc = app.actor.items.get(activityId);
        }
        if (!itemDoc) continue;

        //enrich description
        const rawDescription = itemDoc.description?.trim() || itemDoc.parent?.description?.value || "";
        const enrichedDescription = await TextEditor.enrichHTML(rawDescription, {
          secrets: false,
          async: true,
          relativeTo: itemDoc.parent.parent,
          rollData: itemDoc.parent.parent.getRollData()
        });

        const context = {
          item: {
            img: itemDoc.parent?.parent?.img,
            name: itemDoc.parent?.parent?.name
          },
          activity: {
            img: itemDoc.img,
            name: itemDoc.name
          },
          description: enrichedDescription,
          tags: Array.from((itemDoc.parent.parent.system.chatTags ?? itemDoc.parent.chatTags).entries())
            .map(([key, label]) => ({ key, label }))
            .filter(t => t.label)
        };

        const tooltipHtml = await renderTemplate(
          "modules/bf-qol/templates/activity-tooltip.hbs",
          context
        );

        element.setAttribute("data-tooltip", tooltipHtml);
        element.setAttribute("data-tooltip-direction", "RIGHT");
        element.setAttribute("data-tooltip-class", "bf-qol-tooltip");
        element.dataset.activityTooltipSet = "true";
      }
    });
  }
});
