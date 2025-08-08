// Verify if LibWrapper is installed
Hooks.once('ready', () => {
  if (!game.modules.get('lib-wrapper')?.active && game.user.isGM)
    ui.notifications.error("BF QOL requires the 'libWrapper' module. Please install and activate it.");
});

import { weaponOptionTemplates } from "./data/weapon-option-templates.js";

//Module Settings
function registerSettings() {
  const MODULE_ID = "bf-qol";

  game.settings.register(MODULE_ID, "autoConcentration", {
    name: "Enable Auto-Concentration Effect",
    hint: "Activities with the Concentration tag will automatically apply the effect.",
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
    default: false,
    type: Boolean
  });
}

Hooks.once("init", () => {
  registerSettings();
});

//region Concentration
Hooks.once("init", () => {
  //Add new template
  const parts = BlackFlag.applications.activity.ActivityActivationDialog.PARTS;
  BlackFlag.applications.activity.ActivityActivationDialog.PARTS = {
    concentrating: {
      template: "modules/BF-QOL/templates/activity-activation-concentrating.hbs"
    },
    ...parts
  };

  // Add concentration variables to context BF
  libWrapper.register('bf-qol', 'BlackFlag.applications.activity.ActivityActivationDialog.prototype._preparePartContext', async function (wrapped, partId, context, options) {
    context = await wrapped(partId, context, options);

    if (partId === "concentrating") {
      context.concentrationNote = this.config.concentrationNote;
      context.concentration = !!this.config.concentration;
    }

    return context;
  }, 'WRAPPER');

});

Hooks.on("blackFlag.preActivateActivity", async (activity, activationConfig, dialogConfig, messageConfig) => {
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
  const durationUnit = item.system.duration?.units || "minute";

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
      }
    }
  };

  await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
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
Hooks.on("renderChatMessage", (message, html, data) => {
  const saveConcentration = game.settings.get("bf-qol", "saveConcentration");
  if (!saveConcentration) return;

  if (message.flags["bf-qol-concentrating"]?.displayChallenge) {
    html[0].setAttribute("data-display-challenge", "");
  }

  html.find(".concentration-save-button").click(async (event) => {
    const button = event.currentTarget;
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

//region Weapon Options
//Add weapon options activities
Hooks.on("updateItem", async (item, updateData, options, userId) => {
  const weaponOptions = game.settings.get("bf-qol", "weaponOptions");
  if (!weaponOptions) return;

  if (item.type !== "weapon") return;

  // Check if the item is on a player character sheet
  const actor = item.actor;
  if (!actor) return;
  if (actor.type !== "pc") return; 

  const itemOptions = foundry.utils.getProperty(updateData, "system.options") ?? item.system.options ?? [];
  const currentActivities = item.system.activities ?? {};

  let updated = false;

  // Add weapon options Activities if marked
  for (const option of itemOptions) {
    const template = weaponOptionTemplates[option];
    if (!template) continue;

    const alreadyExists = [...currentActivities.values()].some(
      act => act.flags?.["bf-qol"]?.activity === option
    );
    if (!alreadyExists) {
      const activity = foundry.utils.duplicate(weaponOptionTemplates[option]);
      const id = foundry.utils.randomID();
      activity._id = id;
      currentActivities[id] = activity;
      updated = true;
    }
  }

  // Remove Weapon Options Activites if not marked
  let id_array = []
  for (const act of [...currentActivities]) {
    const match = Object.entries(weaponOptionTemplates).find(([key, tmpl]) => tmpl.flags?.["bf-qol"]?.activity === act.flags?.["bf-qol"]?.activity);
    if (match) {
      const [key, tmpl] = match;
      try {
        if (!itemOptions.includes(key)) {
          id_array.push(act._id);
          updated = true;
        }
      } catch {
        console.log('Error trying to remove activity.')
      }
    }
  }

  // Update Item
  if (updated) {
    const updatedActivities = { ...currentActivities };
    await item.update({ "system.activities": updatedActivities });
    for (const id of id_array) {
      await item.update({ [`system.activities.-=${id}`]: null });
    }
  }
});