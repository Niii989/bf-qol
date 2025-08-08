export const weaponOptionTemplates = {
      "harmlessFusillade": {
        "type": "save",
        "_id": "RzRulybKRZG8Yvis",
        "description": "<p>When you make an attack with this weapon, you can harmlessly discharge the weapon instead of dealing damage while aiming at a creature within the weapon’s normal range. On a successful hit, the target must succeed on a [[/save]]<strong> </strong>save or have disadvantage on the next concentration check it makes before the start of your next turn.</p>",
        "flags": {
          "bf-qol": {
            "activity": "harmlessFusillade"
          }
        },
        "sort": 200000,
        "system": {
          "damage": {
            "parts": []
          },
          "effects": [],
          "save": {
            "ability": [
              "constitution"
            ],
            "dc": {
              "ability": "dexterity",
              "formula": ""
            }
          }
        },
        "activation": {
          "value": null,
          "override": false,
          "primary": true,
          "type": "action",
          "condition": ""
        },
        "consumption": {
          "targets": [],
          "scale": {
            "allowed": false
          }
        },
        "duration": {
          "units": "instantaneous",
          "concentration": false,
          "override": false
        },
        "range": {
          "override": false
        },
        "magical": false,
        "target": {
          "template": {
            "contiguous": false,
            "units": "foot",
            "type": ""
          },
          "affects": {
            "choice": false,
            "type": ""
          },
          "prompt": true,
          "override": false
        },
        "uses": {
          "spent": 0,
          "consumeQuantity": false,
          "recovery": [],
          "max": ""
        },
        "name": "Harmless Fusillade",
        "img": "modules/bf-qol/artwork/weapon-options/explosive-materials.svg"
      },
      "hamstring": {
        "type": "attack",
        "_id": "I2UuM1DG6Pk4gCkJ",
        "description": "<p>Make an attack roll with this weapon. On a hit, the target’s base movement speed is reduced by 10 feet for 1 minute. A creature’s speed can’t be reduced by more than 10 feet with this weapon option. A creature within 5 feet of the target can take an action to tend the wound with a successful WIS (Medicine) check (against your weapon option DC), ending the effect on the target. The effect also ends if the target receives any magical healing.</p>",
        "flags": {
          "bf-qol": {
            "activity": "hamstring"
          }
        },
        "sort": 187500,
        "system": {
          "attack": {
            "critical": {
              "threshold": null
            },
            "flat": false,
            "type": {
              "value": "",
              "classification": ""
            },
            "ability": "",
            "bonus": ""
          },
          "damage": {
            "critical": {
              "bonus": ""
            },
            "includeBase": false,
            "parts": []
          },
          "effects": []
        },
        "activation": {
          "value": null,
          "override": false,
          "primary": true,
          "type": "action",
          "condition": ""
        },
        "consumption": {
          "targets": [],
          "scale": {
            "allowed": false
          }
        },
        "duration": {
          "units": "instantaneous",
          "concentration": false,
          "override": false
        },
        "range": {
          "override": false
        },
        "magical": false,
        "target": {
          "template": {
            "contiguous": false,
            "units": "foot",
            "type": ""
          },
          "affects": {
            "choice": false,
            "type": ""
          },
          "prompt": true,
          "override": false
        },
        "uses": {
          "spent": 0,
          "consumeQuantity": false,
          "recovery": [],
          "max": ""
        },
        "name": "Hamstring",
        "img": "modules/bf-qol/artwork/weapon-options/ragged-wound.svg"
      },
      "bash": {
        "type": "attack",
        "_id": "2jZAvlhdB4LYEYPO",
        "description": "<p>Make an attack roll with this weapon. On a hit, the target has disadvantage on its next attack roll.</p>",
        "flags": {
          "bf-qol": {
            "activity": "bash"
          }
        },
        "sort": 150000,
        "system": {
          "attack": {
            "critical": {
              "threshold": null
            },
            "flat": false,
            "type": {
              "value": "",
              "classification": ""
            },
            "ability": "",
            "bonus": ""
          },
          "damage": {
            "critical": {
              "bonus": ""
            },
            "includeBase": false,
            "parts": []
          },
          "effects": []
        },
        "activation": {
          "value": null,
          "override": false,
          "primary": true,
          "type": "action",
          "condition": ""
        },
        "consumption": {
          "targets": [],
          "scale": {
            "allowed": false
          }
        },
        "duration": {
          "units": "instantaneous",
          "concentration": false,
          "override": false
        },
        "range": {
          "override": false
        },
        "magical": false,
        "target": {
          "template": {
            "contiguous": false,
            "units": "foot",
            "type": ""
          },
          "affects": {
            "choice": false,
            "type": ""
          },
          "prompt": true,
          "override": false
        },
        "uses": {
          "spent": 0,
          "consumeQuantity": false,
          "recovery": [],
          "max": ""
        },
        "name": "Bash",
        "img": "modules/bf-qol/artwork/weapon-options/shield-bash.svg"
      },
      "disarm": {
        "type": "attack",
        "description": "<p>Make an attack roll with this weapon. On a hit, the target must succeed on a STR or DEX save (target’s choice) or drop a weapon, shield, or object it is wielding. The dropped item lands in an unoccupied space within 5 feet of the target. If no unoccupied space is within range, the item lands at the target’s feet.</p>",
        "flags": {
          "bf-qol": {
            "activity": "disarm"
          }
        },
        "sort": 175000,
        "system": {
          "attack": {
            "critical": {
              "threshold": null
            },
            "flat": false,
            "type": {
              "value": "",
              "classification": ""
            },
            "ability": "",
            "bonus": ""
          },
          "damage": {
            "critical": {
              "bonus": ""
            },
            "includeBase": false,
            "parts": []
          },
          "effects": []
        },
        "activation": {
          "value": null,
          "override": false,
          "primary": true,
          "type": "action",
          "condition": ""
        },
        "consumption": {
          "targets": [],
          "scale": {
            "allowed": false
          }
        },
        "duration": {
          "units": "instantaneous",
          "concentration": false,
          "override": false
        },
        "range": {
          "override": false
        },
        "magical": false,
        "target": {
          "template": {
            "contiguous": false,
            "units": "foot",
            "type": ""
          },
          "affects": {
            "choice": false,
            "type": ""
          },
          "prompt": true,
          "override": false
        },
        "uses": {
          "spent": 0,
          "consumeQuantity": false,
          "recovery": [],
          "max": ""
        },
        "name": "Disarm",
        "img": "modules/bf-qol/artwork/weapon-options/drop-weapon.svg",
        "_id": "XoNz1jBRMzZXvhXF"
      },
      "pinningShot": {
        "type": "attack",
        "description": "<p>Make an attack roll with this weapon against a Large or smaller creature. On a hit, the target must succeed on a STR or DEX save (target’s choice) or its speed becomes 0 feet until the end of its next turn. A creature, including the target, can use its action to attempt to free the target with a STR (Athletics) check or a DEX (Acrobatics) check (the creature’s choice) versus the attacker’s weapon option DC. On a success, the target is freed and can move as normal. A target must make only one check to free itself, using the highest DC of characters performing this weapon option, regardless of the number of arrows or bolts holding it in place.</p>",
        "flags": {
          "bf-qol": {
            "activity": "pinningShot"
          }
        },
        "sort": 600000,
        "system": {
          "attack": {
            "critical": {
              "threshold": null
            },
            "flat": false,
            "type": {
              "value": "",
              "classification": ""
            },
            "ability": "",
            "bonus": ""
          },
          "damage": {
            "critical": {
              "bonus": ""
            },
            "includeBase": false,
            "parts": []
          },
          "effects": []
        },
        "activation": {
          "value": null,
          "override": false,
          "primary": true,
          "type": "action",
          "condition": ""
        },
        "consumption": {
          "targets": [],
          "scale": {
            "allowed": false
          }
        },
        "duration": {
          "units": "instantaneous",
          "concentration": false,
          "override": false
        },
        "range": {
          "override": false
        },
        "magical": false,
        "target": {
          "template": {
            "contiguous": false,
            "units": "foot",
            "type": ""
          },
          "affects": {
            "choice": false,
            "type": ""
          },
          "prompt": true,
          "override": false
        },
        "uses": {
          "spent": 0,
          "consumeQuantity": false,
          "recovery": [],
          "max": ""
        },
        "name": "Pinning Shot",
        "img": "modules/bf-qol/artwork/weapon-options/supersonic-arrow.svg",
        "_id": "VTVZGgMuWbyMEmYG"
      },
      "pull": {
        "type": "attack",
        "description": "<p>Make an attack roll with this weapon against a Large or smaller creature. On a hit, the target is pulled up to 5 feet closer to you. If this movement would pull a creature into damaging terrain, such as lava or a pit, it can make a STR or DEX (target’s choice) save to avoid the pull on a success.</p>",
        "flags": {
          "bf-qol": {
            "activity": "pull"
          }
        },
        "sort": 700000,
        "system": {
          "attack": {
            "critical": {
              "threshold": null
            },
            "flat": false,
            "type": {
              "value": "",
              "classification": ""
            },
            "ability": "",
            "bonus": ""
          },
          "damage": {
            "critical": {
              "bonus": ""
            },
            "includeBase": false,
            "parts": []
          },
          "effects": []
        },
        "activation": {
          "value": null,
          "override": false,
          "primary": true,
          "type": "action",
          "condition": ""
        },
        "consumption": {
          "targets": [],
          "scale": {
            "allowed": false
          }
        },
        "duration": {
          "units": "instantaneous",
          "concentration": false,
          "override": false
        },
        "range": {
          "override": false
        },
        "magical": false,
        "target": {
          "template": {
            "contiguous": false,
            "units": "foot",
            "type": ""
          },
          "affects": {
            "choice": false,
            "type": ""
          },
          "prompt": true,
          "override": false
        },
        "uses": {
          "spent": 0,
          "consumeQuantity": false,
          "recovery": [],
          "max": ""
        },
        "name": "Pull",
        "img": "modules/bf-qol/artwork/weapon-options/pull.svg",
        "_id": "owxrwG2Au9no7K0I"
      },
      "trip": {
        "type": "attack",
        "description": "<p>Make an attack roll with this weapon against a Large or smaller creature. On a hit, the target must succeed on a STR or DEX save (target’s choice) or fall prone. If the target is mounted, it has advantage on the save.</p>",
        "flags": {
          "bf-qol": {
            "activity": "trip"
          }
        },
        "sort": 800000,
        "system": {
          "attack": {
            "critical": {
              "threshold": null
            },
            "flat": false,
            "type": {
              "value": "",
              "classification": ""
            },
            "ability": "",
            "bonus": ""
          },
          "damage": {
            "critical": {
              "bonus": ""
            },
            "includeBase": false,
            "parts": []
          },
          "effects": []
        },
        "activation": {
          "value": null,
          "override": false,
          "primary": true,
          "type": "action",
          "condition": ""
        },
        "consumption": {
          "targets": [],
          "scale": {
            "allowed": false
          }
        },
        "duration": {
          "units": "instantaneous",
          "concentration": false,
          "override": false
        },
        "range": {
          "override": false
        },
        "magical": false,
        "target": {
          "template": {
            "contiguous": false,
            "units": "foot",
            "type": ""
          },
          "affects": {
            "choice": false,
            "type": ""
          },
          "prompt": true,
          "override": false
        },
        "uses": {
          "spent": 0,
          "consumeQuantity": false,
          "recovery": [],
          "max": ""
        },
        "name": "Trip",
        "img": "modules/bf-qol/artwork/weapon-options/tripwire.svg",
        "_id": "QzPcOQ3DUlW59u01"
      },
      "ricochetShot": {
        "type": "attack",
        "_id": "IalZOSREQ4gaE5tr",
        "description": "<p>Make an attack roll with this weapon against a target you can see that has half or three-quarters cover. Your chosen target must be within 10 feet of another object or structure that isn’t the same item providing it with cover. When you do so, you can treat the target’s AC as if it wasn’t behind cover. If the attack is successful, the target takes damage from the attack as it would with a standard weapon attack. This weapon option expends the same ammunition as a normal attack with this weapon.</p>",
        "flags": {
          "bf-qol": {
            "activity": "ricochetShot"
          }
        },
        "sort": 750000,
        "system": {
          "attack": {
            "critical": {
              "threshold": null
            },
            "flat": false,
            "type": {
              "value": "",
              "classification": ""
            },
            "ability": "",
            "bonus": ""
          },
          "damage": {
            "critical": {
              "bonus": ""
            },
            "includeBase": true,
            "parts": []
          },
          "effects": []
        },
        "activation": {
          "value": null,
          "override": false,
          "primary": true,
          "type": "action",
          "condition": ""
        },
        "consumption": {
          "targets": [],
          "scale": {
            "allowed": false
          }
        },
        "duration": {
          "units": "instantaneous",
          "concentration": false,
          "override": false
        },
        "range": {
          "override": false
        },
        "magical": false,
        "target": {
          "template": {
            "contiguous": false,
            "units": "foot",
            "type": ""
          },
          "affects": {
            "choice": false,
            "type": ""
          },
          "prompt": true,
          "override": false
        },
        "uses": {
          "spent": 0,
          "consumeQuantity": false,
          "recovery": [],
          "max": ""
        },
        "name": "Ricochet Shot",
        "img": "modules/bf-qol/artwork/weapon-options/ricochet.svg"
      }
}