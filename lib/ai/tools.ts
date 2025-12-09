/**
 * Aisle AI Tool Definitions
 * 
 * These tools allow the AI to take actions, not just chat.
 * Each tool has a name, description, and parameter schema.
 */

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required?: boolean;
  enum?: string[];
  items?: ToolParameter;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, ToolParameter>;
    required: string[];
  };
}

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

export const tools: ToolDefinition[] = [
  // ----------------------------------------
  // BUDGET TOOLS
  // ----------------------------------------
  {
    name: "add_budget_item",
    description: "Add a new item to the wedding budget. Use this when the user mentions a cost, vendor, or expense they're planning.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "The budget category",
          enum: [
            "venue",
            "catering",
            "photography",
            "videography",
            "florist",
            "music_dj",
            "attire",
            "hair_makeup",
            "invitations",
            "cake",
            "decorations",
            "transportation",
            "officiant",
            "rings",
            "favors",
            "honeymoon",
            "other"
          ]
        },
        vendor: {
          type: "string",
          description: "Name of the vendor or description of the expense"
        },
        estimatedCost: {
          type: "number",
          description: "Estimated total cost in dollars"
        },
        amountPaid: {
          type: "number",
          description: "Amount already paid in dollars (default 0)"
        },
        notes: {
          type: "string",
          description: "Any additional notes"
        }
      },
      required: ["category", "estimatedCost"]
    }
  },
  {
    name: "update_budget_item",
    description: "Update an existing budget item. Can find item by ID, or by matching vendor name / category.",
    parameters: {
      type: "object",
      properties: {
        itemId: {
          type: "string",
          description: "The ID of the budget item to update"
        },
        findVendor: {
          type: "string",
          description: "Find item by vendor name (if ID not known)"
        },
        findCategory: {
          type: "string",
          description: "Find item by category (if ID not known)"
        },
        estimatedCost: {
          type: "number",
          description: "New estimated cost in dollars"
        },
        amountPaid: {
          type: "number",
          description: "New amount paid in dollars"
        },
        vendor: {
          type: "string",
          description: "Updated vendor name"
        },
        notes: {
          type: "string",
          description: "Updated notes"
        }
      },
      required: []
    }
  },
  {
    name: "delete_budget_item",
    description: "Remove a budget item. Use when user says to remove, delete, or cancel an expense. Can search by ID, vendor name, category, or amount.",
    parameters: {
      type: "object",
      properties: {
        itemId: {
          type: "string",
          description: "The ID of the budget item to delete"
        },
        vendor: {
          type: "string",
          description: "Vendor name to search for (partial match supported)"
        },
        category: {
          type: "string",
          description: "Category name to search for (e.g., 'attire', 'rings', 'Wedding Attire')"
        },
        amount: {
          type: "number",
          description: "Cost amount in dollars to match (useful for finding specific items)"
        }
      },
      required: []
    }
  },
  {
    name: "set_total_budget",
    description: "Set or update the total wedding budget.",
    parameters: {
      type: "object",
      properties: {
        amount: {
          type: "number",
          description: "Total budget in dollars"
        }
      },
      required: ["amount"]
    }
  },

  // ----------------------------------------
  // GUEST LIST TOOLS
  // ----------------------------------------
  {
    name: "add_guest",
    description: "Add a guest to the wedding guest list. Use when user mentions someone they want to invite.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Guest's full name"
        },
        email: {
          type: "string",
          description: "Guest's email address"
        },
        phone: {
          type: "string",
          description: "Guest's phone number"
        },
        address: {
          type: "string",
          description: "Mailing address for invitations"
        },
        side: {
          type: "string",
          description: "Which partner invited them",
          enum: ["partner1", "partner2", "both"]
        },
        group: {
          type: "string",
          description: "Guest grouping (e.g., 'Family', 'College Friends', 'Work', 'Neighborhood')"
        },
        plusOne: {
          type: "boolean",
          description: "Whether they get a plus one"
        },
        rsvp: {
          type: "string",
          description: "RSVP status if known",
          enum: ["pending", "confirmed", "declined"]
        },
        mealChoice: {
          type: "string",
          description: "Meal preference if known"
        },
        dietaryRestrictions: {
          type: "string",
          description: "Any dietary restrictions or allergies"
        },
        tableNumber: {
          type: "number",
          description: "Assigned table number for seating"
        },
        notes: {
          type: "string",
          description: "Any notes about this guest"
        }
      },
      required: ["name"]
    }
  },
  {
    name: "update_guest",
    description: "Update a guest's information. Can find guest by name (partial match supported) or ID. Use when user wants to change guest details, RSVP status, meal choice, table assignment, etc.",
    parameters: {
      type: "object",
      properties: {
        guestName: {
          type: "string",
          description: "Guest's name to search for (partial match supported)"
        },
        guestId: {
          type: "string",
          description: "The ID of the guest to update (if known)"
        },
        name: {
          type: "string",
          description: "New name for the guest"
        },
        email: {
          type: "string",
          description: "Updated email address"
        },
        phone: {
          type: "string",
          description: "Updated phone number"
        },
        address: {
          type: "string",
          description: "Updated mailing address"
        },
        side: {
          type: "string",
          description: "Which partner invited them",
          enum: ["partner1", "partner2", "both"]
        },
        group: {
          type: "string",
          description: "Updated group assignment"
        },
        plusOne: {
          type: "boolean",
          description: "Whether they get a plus one"
        },
        plusOneName: {
          type: "string",
          description: "Name of their plus one"
        },
        rsvp: {
          type: "string",
          description: "RSVP status",
          enum: ["pending", "confirmed", "declined"]
        },
        mealChoice: {
          type: "string",
          description: "Their meal selection"
        },
        dietaryRestrictions: {
          type: "string",
          description: "Any dietary restrictions"
        },
        tableNumber: {
          type: "number",
          description: "Assigned table number"
        },
        giftReceived: {
          type: "boolean",
          description: "Whether a gift has been received from this guest"
        },
        thankYouSent: {
          type: "boolean",
          description: "Whether a thank you note has been sent"
        },
        notes: {
          type: "string",
          description: "Any notes about this guest"
        }
      },
      required: []
    }
  },
  {
    name: "delete_guest",
    description: "Remove a guest from the guest list. Can find by name (partial match) or ID. Use when user says someone is no longer invited.",
    parameters: {
      type: "object",
      properties: {
        guestId: {
          type: "string",
          description: "The ID of the guest to remove"
        },
        guestName: {
          type: "string",
          description: "Guest's name to search for (partial match supported)"
        }
      },
      required: []
    }
  },
  {
    name: "add_guest_group",
    description: "Add multiple guests at once (like a family or friend group). Use for bulk additions.",
    parameters: {
      type: "object",
      properties: {
        guests: {
          type: "array",
          description: "Array of guest names to add",
          items: { type: "string", description: "Guest name" }
        },
        side: {
          type: "string",
          description: "Which partner invited them",
          enum: ["partner1", "partner2", "both"]
        },
        group: {
          type: "string",
          description: "Group name (e.g., 'Smith Family', 'College Friends')"
        },
        plusOnes: {
          type: "boolean",
          description: "Whether all guests in this group get plus ones"
        },
        address: {
          type: "string",
          description: "Shared address for the group (useful for families)"
        }
      },
      required: ["guests"]
    }
  },
  {
    name: "get_guest_list",
    description: "Get the current guest list with optional filtering. Use to see who's on the list, check RSVPs, see meal choices, etc.",
    parameters: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          description: "Filter type",
          enum: ["all", "confirmed", "declined", "pending", "no_address", "no_meal", "with_plus_one", "no_thank_you"]
        },
        group: {
          type: "string",
          description: "Filter by group name"
        },
        side: {
          type: "string",
          description: "Filter by side",
          enum: ["partner1", "partner2", "both"]
        },
        search: {
          type: "string",
          description: "Search by name"
        }
      },
      required: []
    }
  },
  {
    name: "get_guest_stats",
    description: "Get statistics about the guest list - counts, RSVPs, meal choices, etc. Use when user asks 'how many guests', 'who has RSVPed', 'meal count', etc.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "sync_rsvp_responses",
    description: "Sync all unsynced RSVP form responses to the guest list. Use when user wants to import RSVP responses or update guest list from form submissions.",
    parameters: {
      type: "object",
      properties: {
        onlyNew: {
          type: "boolean",
          description: "Only sync responses that haven't been synced yet (default true)"
        }
      },
      required: []
    }
  },

  // ----------------------------------------
  // RSVP TOOLS
  // ----------------------------------------
  {
    name: "create_rsvp_link",
    description: "Create a shareable RSVP link for guests to submit their information (address, meal choice, attendance, etc). Use when the user wants to collect guest information or create a form for guests to RSVP.",
    parameters: {
      type: "object",
      properties: {
        collectEmail: {
          type: "boolean",
          description: "Whether to collect email addresses (default true)"
        },
        collectPhone: {
          type: "boolean",
          description: "Whether to collect phone numbers (default false)"
        },
        collectAddress: {
          type: "boolean",
          description: "Whether to collect mailing addresses (default true)"
        },
        collectMealChoice: {
          type: "boolean",
          description: "Whether to collect meal preferences (default false)"
        },
        collectDietaryRestrictions: {
          type: "boolean",
          description: "Whether to collect dietary restrictions (default false)"
        },
        collectPlusOne: {
          type: "boolean",
          description: "Whether to ask about plus ones (default false)"
        },
        collectSongRequest: {
          type: "boolean",
          description: "Whether to collect song requests (default false)"
        },
        mealOptions: {
          type: "array",
          description: "List of meal options if collecting meal choice (e.g., ['Chicken', 'Fish', 'Vegetarian'])",
          items: { type: "string", description: "Meal option" }
        }
      },
      required: []
    }
  },
  {
    name: "get_rsvp_link",
    description: "Get the existing RSVP link for sharing with guests. Use when the user asks for their RSVP link or wants to share it.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },
  {
    name: "get_rsvp_responses",
    description: "Get a summary of RSVP responses received so far.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },

  // ----------------------------------------
  // CALENDAR / TIMELINE TOOLS
  // ----------------------------------------
  {
    name: "add_event",
    description: "Add an event to the wedding calendar (appointments, deadlines, tasks).",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Event title"
        },
        date: {
          type: "string",
          description: "Event date (YYYY-MM-DD format)"
        },
        time: {
          type: "string",
          description: "Event time (HH:MM format, optional)"
        },
        endTime: {
          type: "string",
          description: "End time if applicable"
        },
        location: {
          type: "string",
          description: "Location of the event"
        },
        category: {
          type: "string",
          description: "Type of event",
          enum: ["vendor_meeting", "deadline", "appointment", "tasting", "fitting", "other"]
        },
        notes: {
          type: "string",
          description: "Additional notes"
        }
      },
      required: ["title", "date"]
    }
  },
  {
    name: "add_day_of_event",
    description: "Add an event to the wedding day timeline.",
    parameters: {
      type: "object",
      properties: {
        time: {
          type: "string",
          description: "Time of the event (e.g., '4:00 PM')"
        },
        event: {
          type: "string",
          description: "What happens at this time"
        },
        duration: {
          type: "number",
          description: "Duration in minutes"
        },
        location: {
          type: "string",
          description: "Where this happens"
        },
        notes: {
          type: "string",
          description: "Additional details"
        }
      },
      required: ["time", "event"]
    }
  },

  // ----------------------------------------
  // VENDOR TOOLS
  // ----------------------------------------
  {
    name: "add_vendor",
    description: "Add a vendor to track (booked or considering).",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Type of vendor",
          enum: [
            "venue",
            "photographer",
            "videographer",
            "caterer",
            "florist",
            "dj",
            "band",
            "officiant",
            "planner",
            "hair",
            "makeup",
            "cake",
            "rentals",
            "transportation",
            "other"
          ]
        },
        name: {
          type: "string",
          description: "Vendor/company name"
        },
        contactName: {
          type: "string",
          description: "Contact person's name"
        },
        email: {
          type: "string",
          description: "Email address"
        },
        phone: {
          type: "string",
          description: "Phone number"
        },
        status: {
          type: "string",
          description: "Current status",
          enum: ["researching", "contacted", "meeting_scheduled", "booked", "passed"]
        },
        price: {
          type: "number",
          description: "Quoted price in dollars"
        },
        notes: {
          type: "string",
          description: "Notes about this vendor"
        }
      },
      required: ["category", "name"]
    }
  },
  {
    name: "update_vendor",
    description: "Update a vendor's information (status, details, price, etc.). Can find vendor by ID or name.",
    parameters: {
      type: "object",
      properties: {
        vendorId: {
          type: "string",
          description: "The ID of the vendor to update"
        },
        vendorName: {
          type: "string",
          description: "The name of the vendor to update (if ID not known)"
        },
        name: {
          type: "string",
          description: "New vendor name"
        },
        category: {
          type: "string",
          description: "New category"
        },
        contactName: {
          type: "string",
          description: "Contact person's name"
        },
        email: {
          type: "string",
          description: "Email address"
        },
        phone: {
          type: "string",
          description: "Phone number"
        },
        status: {
          type: "string",
          description: "New status",
          enum: ["researching", "contacted", "meeting_scheduled", "booked", "passed"]
        },
        price: {
          type: "number",
          description: "Price in dollars"
        },
        depositPaid: {
          type: "boolean",
          description: "Whether deposit has been paid"
        },
        contractSigned: {
          type: "boolean",
          description: "Whether contract has been signed"
        },
        notes: {
          type: "string",
          description: "Notes about this vendor"
        }
      },
      required: []
    }
  },
  {
    name: "get_vendor_list",
    description: "Get the current list of vendors with optional filtering. Use to see who has been booked, check status, or find specific vendors.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filter by category",
          enum: [
            "venue",
            "photographer",
            "videographer",
            "caterer",
            "florist",
            "dj",
            "band",
            "officiant",
            "planner",
            "hair",
            "makeup",
            "cake",
            "rentals",
            "transportation",
            "other"
          ]
        },
        status: {
          type: "string",
          description: "Filter by status",
          enum: ["researching", "contacted", "meeting_scheduled", "booked", "passed"]
        },
        search: {
          type: "string",
          description: "Search by vendor name or contact name"
        }
      },
      required: []
    }
  },
  {
    name: "delete_vendor",
    description: "Remove a vendor from tracking. Use when user decides not to consider a vendor anymore. Can delete by ID, name (partial match), or delete all vendors in a specific category.",
    parameters: {
      type: "object",
      properties: {
        vendorId: {
          type: "string",
          description: "The ID of the vendor to remove"
        },
        vendorName: {
          type: "string",
          description: "Find and remove by name (partial match supported)"
        },
        category: {
          type: "string",
          description: "Delete ALL vendors in this category (use with caution!) or use to narrow down name search",
          enum: [
            "venue",
            "photographer",
            "videographer",
            "caterer",
            "florist",
            "dj",
            "band",
            "officiant",
            "planner",
            "hair",
            "makeup",
            "cake",
            "rentals",
            "transportation",
            "other"
          ]
        }
      },
      required: []
    }
  },

  // ----------------------------------------
  // TASK TOOLS
  // ----------------------------------------
  {
    name: "add_task",
    description: "Add a task to the wedding to-do list.",
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Task description"
        },
        dueDate: {
          type: "string",
          description: "When it's due (YYYY-MM-DD)"
        },
        assignee: {
          type: "string",
          description: "Who's responsible",
          enum: ["partner1", "partner2", "both", "other"]
        },
        priority: {
          type: "string",
          description: "Priority level",
          enum: ["low", "medium", "high"]
        },
        category: {
          type: "string",
          description: "Task category"
        }
      },
      required: ["title"]
    }
  },
  {
    name: "complete_task",
    description: "Mark a task as complete.",
    parameters: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "The ID of the task to complete"
        }
      },
      required: ["taskId"]
    }
  },
  {
    name: "delete_task",
    description: "Remove a task from the to-do list.",
    parameters: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "The ID of the task to delete"
        },
        taskTitle: {
          type: "string",
          description: "If no taskId, find and delete by title"
        }
      },
      required: []
    }
  },

  // ----------------------------------------
  // KERNEL / PROFILE TOOLS
  // ----------------------------------------
  {
    name: "update_wedding_details",
    description: "Update core wedding details like date, venue, guest count, etc.",
    parameters: {
      type: "object",
      properties: {
        weddingDate: {
          type: "string",
          description: "Wedding date (YYYY-MM-DD)"
        },
        ceremonyTime: {
          type: "string",
          description: "Ceremony start time"
        },
        receptionTime: {
          type: "string",
          description: "Reception start time"
        },
        guestCount: {
          type: "number",
          description: "Expected guest count"
        },
        venueName: {
          type: "string",
          description: "Venue name"
        },
        venueAddress: {
          type: "string",
          description: "Venue address"
        }
      },
      required: []
    }
  },
  {
    name: "update_preferences",
    description: "Update the couple's preferences and style.",
    parameters: {
      type: "object",
      properties: {
        vibe: {
          type: "array",
          description: "Style keywords",
          items: { type: "string", description: "Vibe keyword" }
        },
        colorPalette: {
          type: "array",
          description: "Color palette",
          items: { type: "string", description: "Color" }
        },
        mustHaves: {
          type: "array",
          description: "Things they definitely want",
          items: { type: "string", description: "Must have" }
        },
        dealbreakers: {
          type: "array",
          description: "Things they definitely don't want",
          items: { type: "string", description: "Dealbreaker" }
        }
      },
      required: []
    }
  },

  // ----------------------------------------
  // DECISION TOOLS
  // ----------------------------------------
  {
    name: "update_decision",
    description: "Update a wedding decision (venue, photographer, etc). Use this when the couple makes progress on a decision - whether they're starting to research, have decided, or are locking it in. IMPORTANT: Check if something is locked before trying to change it.",
    parameters: {
      type: "object",
      properties: {
        decisionName: {
          type: "string",
          description: "The decision identifier",
          enum: [
            "wedding_date", "budget", "wedding_budget", "guest_count", "style",
            "ceremony_venue", "reception_venue", "rehearsal_dinner_venue",
            "photographer", "videographer", "caterer", "dj_band", "florist", "officiant", "cake_baker", "hair_makeup",
            "wedding_dress", "partner_attire", "wedding_rings", "wedding_party_attire",
            "ceremony_music", "vows", "readings",
            "menu", "seating_chart", "first_dance_song", "reception_music",
            "guest_list", "save_the_dates", "invitations",
            "transportation", "accommodations", "day_of_timeline",
            "marriage_license",
            "honeymoon_destination", "honeymoon_bookings"
          ]
        },
        status: {
          type: "string",
          description: "The new status",
          enum: ["not_started", "researching", "decided"]
        },
        choiceName: {
          type: "string",
          description: "What they chose (venue name, vendor name, etc)"
        },
        choiceAmount: {
          type: "number",
          description: "Cost in dollars if applicable"
        },
        estimatedCost: {
          type: "number",
          description: "Estimated cost in dollars"
        },
        notes: {
          type: "string",
          description: "Any notes about this decision"
        }
      },
      required: ["decisionName"]
    }
  },
  {
    name: "lock_decision",
    description: "Lock a decision so it can't be changed. Use when deposit is paid, contract is signed, or user explicitly confirms. ALWAYS confirm with user before locking.",
    parameters: {
      type: "object",
      properties: {
        decisionName: {
          type: "string",
          description: "The decision to lock"
        },
        reason: {
          type: "string",
          description: "Why it's being locked",
          enum: ["deposit_paid", "contract_signed", "full_payment", "user_confirmed"]
        },
        details: {
          type: "string",
          description: "Details like amount paid, date signed, etc"
        }
      },
      required: ["decisionName", "reason"]
    }
  },
  {
    name: "skip_decision",
    description: "Mark a decision as skipped (e.g., 'we're not having a videographer'). Cannot skip required decisions.",
    parameters: {
      type: "object",
      properties: {
        decisionName: {
          type: "string",
          description: "The decision to skip"
        }
      },
      required: ["decisionName"]
    }
  },
  {
    name: "get_decision_status",
    description: "Check the status of a specific decision, including whether it's locked.",
    parameters: {
      type: "object",
      properties: {
        decisionName: {
          type: "string",
          description: "The decision to check"
        }
      },
      required: ["decisionName"]
    }
  },
  {
    name: "mark_decision_complete",
    description: "Mark a decision as done/decided without needing details. Use when user says 'I finished X' or 'Check off X'.",
    parameters: {
      type: "object",
      properties: {
        decisionName: {
          type: "string",
          description: "The decision to mark as complete"
        }
      },
      required: ["decisionName"]
    }
  },
  {
    name: "show_checklist",
    description: "Show the wedding planning checklist with all decisions and their status.",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filter by category (optional)",
          enum: ["foundation", "venue", "vendors", "attire", "ceremony", "reception", "guests", "logistics", "legal", "honeymoon"]
        },
        showCompleted: {
          type: "boolean",
          description: "Whether to show completed/locked items (default true)"
        }
      },
      required: []
    }
  },
  {
    name: "add_custom_decision",
    description: "Add a custom decision to the checklist that isn't in the default list.",
    parameters: {
      type: "object",
      properties: {
        displayName: {
          type: "string",
          description: "Display name for the decision (e.g., 'After Party Venue')"
        },
        category: {
          type: "string",
          description: "Which category it belongs to",
          enum: ["foundation", "venue", "vendors", "attire", "ceremony", "reception", "guests", "logistics", "legal", "honeymoon"]
        }
      },
      required: ["displayName", "category"]
    }
  },

  // ----------------------------------------
  // PLANNING ANALYSIS TOOLS
  // ----------------------------------------
  {
    name: "analyze_planning_gaps",
    description: "Analyze the wedding planning status and identify what's missing, what needs attention, and upcoming deadlines. Use this proactively when user asks about planning status, what they should focus on, or what's left to do.",
    parameters: {
      type: "object",
      properties: {
        focusArea: {
          type: "string",
          description: "Optional area to focus analysis on",
          enum: ["vendors", "budget", "guests", "timeline", "all"]
        }
      },
      required: []
    }
  },

  // ----------------------------------------
  // INSPIRATION TOOLS
  // ----------------------------------------
  {
    name: "create_palette",
    description: "Create a new inspiration palette (board).",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the palette (e.g., 'Floral Ideas', 'Dress Inspo')"
        },
        description: {
          type: "string",
          description: "Optional description of what this board is for"
        }
      },
      required: ["name"]
    }
  },
  {
    name: "save_spark",
    description: "Save an inspiration item (spark) to a palette.",
    parameters: {
      type: "object",
      properties: {
        paletteId: {
          type: "string",
          description: "ID of the palette to save to (if known)"
        },
        paletteName: {
          type: "string",
          description: "Name of the palette to save to (will find or create)"
        },
        imageUrl: {
          type: "string",
          description: "URL of the image to save"
        },
        title: {
          type: "string",
          description: "Title of the spark"
        },
        description: {
          type: "string",
          description: "Description or note about why this is being saved"
        },
        tags: {
          type: "array",
          description: "Tags for categorization",
          items: { type: "string", description: "Tag" }
        }
      },
      required: ["imageUrl"]
    }
  },
  {
    name: "get_palettes",
    description: "Get a list of all inspiration palettes and their recent sparks.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },

  // ----------------------------------------
  // KNOWLEDGE BASE TOOLS
  // ----------------------------------------
  {
    name: "query_knowledge_base",
    description: "Search the wedding knowledge base for advice on etiquette, traditions, timelines, and best practices.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query or question"
        },
        category: {
          type: "string",
          description: "Optional category filter",
          enum: ["budget", "timeline", "etiquette", "vendors", "tips"]
        }
      },
      required: ["query"]
    }
  },

  // ----------------------------------------
  // LOGIC TOOLS
  // ----------------------------------------
  {
    name: "calculate_budget_breakdown",
    description: "Calculate a recommended budget breakdown based on a total amount and standard industry ratios.",
    parameters: {
      type: "object",
      properties: {
        totalBudget: {
          type: "number",
          description: "Total budget amount in dollars"
        },
        priorities: {
          type: "array",
          description: "List of priority categories to allocate more budget to",
          items: { type: "string", description: "Category" }
        }
      },
      required: ["totalBudget"]
    }
  },

  // ----------------------------------------
  // SEATING CHART TOOLS
  // ----------------------------------------
  {
    name: "create_seating_table",
    description: "Create a table for the seating chart.",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Name of the table (e.g., 'Head Table', 'Table 1')"
        },
        capacity: {
          type: "number",
          description: "Number of seats at this table"
        },
        tableNumber: {
          type: "number",
          description: "Numeric identifier for the table (optional, helpful for sorting)"
        }
      },
      required: ["name", "capacity"]
    }
  },
  {
    name: "assign_guest_seat",
    description: "Assign a guest to a specific table.",
    parameters: {
      type: "object",
      properties: {
        guestName: {
          type: "string",
          description: "Name of the guest to assign"
        },
        tableName: {
          type: "string",
          description: "Name or number of the table to assign them to"
        }
      },
      required: ["guestName", "tableName"]
    }
  },
  {
    name: "get_seating_chart",
    description: "Get the current seating chart with tables and assigned guests.",
    parameters: {
      type: "object",
      properties: {},
      required: []
    }
  },

  // ----------------------------------------
  // EXTERNAL TOOLS
  // ----------------------------------------
  {
    name: "web_search",
    description: "Search the web for information about wedding vendors, venues, etiquette, or inspiration. Use this when the user asks a question that requires current or specific external knowledge.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        }
      },
      required: ["query"]
    }
  }
];

// ============================================================================
// HELPER: Convert to Anthropic tool format
// ============================================================================

export function getAnthropicTools() {
  return tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    input_schema: tool.parameters
  }));
}

// ============================================================================
// HELPER: Get tool by name
// ============================================================================

export function getToolByName(name: string): ToolDefinition | undefined {
  return tools.find(t => t.name === name);
}
