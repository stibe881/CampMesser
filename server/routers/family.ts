/**
 * Familien-Modus: Kinder, Ämtli, Schatzsuche, Quizze (#331).
 *
 * Aus `server/routers.ts` herausgelöst, Verhalten unverändert. Der
 * gemeinsame Unterbau steht in `_shared.ts`.
 */
import {
  MAX_CHORES,
  MAX_CHORE_TITLE_LENGTH,
  MAX_HUNT_NAME_LENGTH,
  MAX_POINT_HINT_LENGTH,
  MAX_POINT_NAME_LENGTH,
  MAX_STATIONS,
  MAX_TREASURE_POINTS,
  TRPCError,
  clampPoints,
  customQuizInput,
  db,
  isBadgeId,
  nanoid,
  nextSortIndex,
  normalizeHuntName,
  parseQuizQuestions,
  protectedProcedure,
  publicProcedure,
  choresForDay,
  rotateAssignments,
  scoreboard,
  availablePoints,
  clampRewardPoints,
  MAX_REWARDS,
  REWARD_TITLE_MAX_LENGTH,
  router,
  serializeQuizQuestions,
  shareExpiryFor,
  shareExpiryInput,
  solutionWordFromStations,
  z,
} from "./_shared";

export const familyRouters = {
  /**
   * Transportkisten (#276): Wo liegt was, wenn die Ausrüstung im Keller
   * steht? Jede Kiste hat eine kurze Kennung, die auf dem Etikett steht und
   * im QR-Code steckt.
   */
  /** GPS-Schatzsuche (#267): Verstecke anlegen und den Spielstand führen. */
  treasure: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const hunts = await db.getTreasureHunts(ctx.user.id);
      // Die Punkte gehören zum Spielstand und werden mitgeliefert – eine
      // Schatzsuche ohne ihre Stationen ist keine Information wert
      return Promise.all(
        hunts.map(async hunt => ({
          ...hunt,
          points: await db.getTreasurePoints(hunt.id),
        }))
      );
    }),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().max(MAX_HUNT_NAME_LENGTH) }))
      .mutation(async ({ ctx, input }) => {
        const name = normalizeHuntName(input.name);
        const id = await db.createTreasureHunt({
          userId: ctx.user.id,
          name: name || "Schatzsuche",
        });
        return { id } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTreasureHunt(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /** Versteck am aktuellen Standort anlegen. */
    addPoint: protectedProcedure
      .input(
        z.object({
          huntId: z.number().int().positive(),
          name: z.string().trim().min(1).max(MAX_POINT_NAME_LENGTH),
          hint: z.string().trim().max(MAX_POINT_HINT_LENGTH).nullish(),
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hunt = await db.getTreasureHunt(input.huntId, ctx.user.id);
        if (!hunt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schatzsuche nicht gefunden.",
          });
        }
        const points = await db.getTreasurePoints(input.huntId);
        if (points.length >= MAX_TREASURE_POINTS) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Mehr als ${MAX_TREASURE_POINTS} Verstecke pro Suche sind nicht vorgesehen.`,
          });
        }
        const id = await db.createTreasurePoint({
          huntId: input.huntId,
          name: input.name.trim(),
          hint: input.hint?.trim() || null,
          latitude: input.latitude,
          longitude: input.longitude,
          sortIndex: nextSortIndex(points),
        });
        return { id } as const;
      }),
    removePoint: protectedProcedure
      .input(
        z.object({
          huntId: z.number().int().positive(),
          pointId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hunt = await db.getTreasureHunt(input.huntId, ctx.user.id);
        if (!hunt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schatzsuche nicht gefunden.",
          });
        }
        await db.deleteTreasurePoint(input.pointId, input.huntId);
        return { success: true } as const;
      }),
    /** Punkt als gefunden melden oder wieder verstecken. */
    setFound: protectedProcedure
      .input(
        z.object({
          huntId: z.number().int().positive(),
          pointId: z.number().int().positive(),
          found: z.boolean(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const hunt = await db.getTreasureHunt(input.huntId, ctx.user.id);
        if (!hunt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schatzsuche nicht gefunden.",
          });
        }
        await db.setTreasurePointFound(
          input.pointId,
          input.huntId,
          input.found ? new Date() : null
        );
        return { success: true } as const;
      }),
    /** Spielstand zurücksetzen – die Verstecke bleiben, wo sie sind. */
    reset: protectedProcedure
      .input(z.object({ huntId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const hunt = await db.getTreasureHunt(input.huntId, ctx.user.id);
        if (!hunt) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Schatzsuche nicht gefunden.",
          });
        }
        await db.resetTreasureHunt(input.huntId);
        return { success: true } as const;
      }),
  }),
  /** Ämtli-Plan im Camp (#270): Aufgaben, Zuteilung pro Tag, Punkte. */
  chores: router({
    list: protectedProcedure.query(({ ctx }) => db.getCampChores(ctx.user.id)),
    /** Zuteilungen eines Tages; ohne Tag alle (für den Punktestand). */
    assignments: protectedProcedure
      .input(
        z.object({
          day: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/)
            .optional(),
        })
      )
      .query(({ ctx, input }) =>
        db.getChoreAssignments(ctx.user.id, input.day)
      ),
    add: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(1).max(MAX_CHORE_TITLE_LENGTH),
          points: z.number().int(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getCampChores(ctx.user.id);
        if (existing.length >= MAX_CHORES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Mehr als ${MAX_CHORES} Ämtli sind nicht vorgesehen.`,
          });
        }
        const id = await db.createCampChore({
          userId: ctx.user.id,
          title: input.title.trim(),
          points: clampPoints(input.points),
        });
        return { id } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteCampChore(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    /**
     * Wochentage eines Ämtli setzen (#447): «Abfall rausbringen» fällt
     * nur dienstags an. Leer oder alle sieben Tage heisst «täglich» und
     * wird als null gespeichert.
     */
    setWeekdays: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          weekdays: z.array(z.number().int().min(1).max(7)).max(7),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const days = Array.from(new Set(input.weekdays)).sort((a, b) => a - b);
        const json =
          days.length === 0 || days.length === 7 ? null : JSON.stringify(days);
        await db.setCampChoreWeekdays(input.id, ctx.user.id, json);
        return { success: true } as const;
      }),
    /**
     * Ämtli des Tages reihum verteilen. Bestehende Zuteilungen des Tages
     * werden ersetzt – «neu verteilen» heisst neu verteilen, nicht
     * dazulegen.
     */
    autoAssign: protectedProcedure
      .input(z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .mutation(async ({ ctx, input }) => {
        const [chores, children] = await Promise.all([
          db.getCampChores(ctx.user.id),
          db.getFamilyChildren(ctx.user.id),
        ]);
        if (children.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Lege zuerst im Familien-Modus Kinder an.",
          });
        }
        await db.deleteChoreAssignmentsForDay(ctx.user.id, input.day);
        // Wochentage (#447): nur die an diesem Tag anfallenden Ämtli verteilen
        const planned = rotateAssignments(
          choresForDay(chores, input.day),
          children,
          input.day
        );
        for (const entry of planned) {
          await db.createChoreAssignment({
            userId: ctx.user.id,
            choreId: entry.choreId,
            childId: entry.childId,
            day: input.day,
          });
        }
        return { assigned: planned.length } as const;
      }),
    /** Ein einzelnes Ämtli einem Kind zuteilen (null = wieder offen). */
    assign: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          childId: z.number().int().positive().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateChoreAssignment(input.id, ctx.user.id, {
          childId: input.childId,
        });
        return { success: true } as const;
      }),
    /** Abhaken – erst jetzt gibt es Punkte. */
    setDone: protectedProcedure
      .input(z.object({ id: z.number().int().positive(), done: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateChoreAssignment(input.id, ctx.user.id, {
          doneAt: input.done ? new Date() : null,
        });
        return { success: true } as const;
      }),
  }),

  hunts: router({
    list: protectedProcedure.query(({ ctx }) => db.getCustomHunts(ctx.user.id)),
    save: protectedProcedure
      .input(
        z.object({
          /** Ohne id wird neu angelegt, mit id die eigene Jagd aktualisiert */
          id: z.number().int().positive().optional(),
          title: z.string().min(1).max(140),
          ageHint: z.string().max(80).nullish(),
          durationMinutes: z.number().int().min(5).max(240).default(30),
          intro: z.string().min(1).max(2000),
          preparation: z.string().max(2000).nullish(),
          finale: z.string().min(1).max(2000),
          stations: z
            .array(
              z.object({
                title: z.string().min(1).max(140),
                story: z.string().max(1000).default(""),
                task: z.string().min(1).max(1000),
                hint: z.string().max(500).optional(),
                letter: z.string().max(2).optional(),
              })
            )
            .min(1)
            .max(MAX_STATIONS),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const stations = input.stations.map(s => ({
          title: s.title.trim(),
          story: s.story.trim(),
          task: s.task.trim(),
          hint: s.hint?.trim() || undefined,
          letter: s.letter?.trim().slice(0, 1).toUpperCase() || undefined,
        }));
        const data = {
          title: input.title.trim(),
          ageHint: input.ageHint?.trim() || null,
          durationMinutes: input.durationMinutes,
          intro: input.intro.trim(),
          preparation: input.preparation?.trim() || null,
          finale: input.finale.trim(),
          stationsJson: JSON.stringify(stations),
          solutionWord: solutionWordFromStations(stations),
        };
        if (input.id) {
          const own = await db.getCustomHunts(ctx.user.id);
          if (!own.some(h => h.id === input.id)) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Schnitzeljagd nicht gefunden.",
            });
          }
          await db.updateCustomHunt(input.id, ctx.user.id, data);
          return { id: input.id };
        }
        const id = await db.addCustomHunt({ userId: ctx.user.id, ...data });
        return { id };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteCustomHunt(input.id, ctx.user.id)),
  }),

  quizzes: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getCustomQuizzes(ctx.user.id)
    ),
    create: protectedProcedure
      .input(customQuizInput)
      .mutation(async ({ ctx, input }) => {
        const id = await db.addCustomQuiz({
          userId: ctx.user.id,
          title: input.title.trim(),
          questionsJson: serializeQuizQuestions(input.questions),
        });
        return { id };
      }),
    update: protectedProcedure
      .input(customQuizInput.extend({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const own = await db.getCustomQuizzes(ctx.user.id);
        if (!own.some(q => q.id === input.id)) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Quiz nicht gefunden.",
          });
        }
        await db.updateCustomQuiz(input.id, ctx.user.id, {
          title: input.title.trim(),
          questionsJson: serializeQuizQuestions(input.questions),
        });
        return { id: input.id };
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ ctx, input }) => db.deleteCustomQuiz(input.id, ctx.user.id)),
    /** Teil-Link für ein eigenes Quiz erzeugen: gibt den Token zurück. */
    share: protectedProcedure
      .input(z.object({ id: z.number(), expiresInDays: shareExpiryInput }))
      .mutation(async ({ ctx, input }) => {
        const quiz = await db.getCustomQuiz(input.id, ctx.user.id);
        if (!quiz)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Quiz nicht gefunden.",
          });
        const expiresAt = shareExpiryFor(
          input.expiresInDays,
          quiz.shareExpiresAt
        );
        const token = quiz.shareToken ?? nanoid(16);
        await db.setCustomQuizShareToken(
          input.id,
          ctx.user.id,
          token,
          expiresAt
        );
        return { token, expiresAt };
      }),
    /** Teilen des Quiz beenden: Token entfernen, Link wird ungültig. */
    unshare: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setCustomQuizShareToken(input.id, ctx.user.id, null);
        return { success: true } as const;
      }),
    /** Geteiltes Quiz öffentlich abrufen (kein Login nötig) – ohne Lösungen. */
    sharedGet: publicProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .query(async ({ input }) => {
        const quiz = await db.getCustomQuizByToken(input.token);
        if (!quiz) return { quiz: null };
        const questions = parseQuizQuestions(quiz.questionsJson);
        return {
          quiz: {
            title: quiz.title,
            questionCount: questions.length,
            // Nur die erste Frage als Vorgeschmack – Antworten bleiben geheim
            sampleQuestion: questions[0]?.question ?? null,
          },
        };
      }),
    /** Geteiltes Quiz als eigenes Quiz übernehmen (Kopie). */
    importShared: protectedProcedure
      .input(z.object({ token: z.string().min(8).max(64) }))
      .mutation(async ({ ctx, input }) => {
        const quiz = await db.getCustomQuizByToken(input.token);
        if (!quiz)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Geteiltes Quiz nicht gefunden.",
          });
        // Über den defensiven Parser re-serialisieren – kaputte Daten bleiben draussen
        const questions = parseQuizQuestions(quiz.questionsJson);
        if (questions.length === 0)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Das geteilte Quiz hat keine gültigen Fragen.",
          });
        const id = await db.addCustomQuiz({
          userId: ctx.user.id,
          title: quiz.title,
          questionsJson: JSON.stringify(questions),
        });
        return { id };
      }),
  }),

  /** Familien-Modus: Kinder-Profile, Abzeichen und Ereignis-Zähler. */
  family: router({
    children: router({
      list: protectedProcedure.query(({ ctx }) =>
        db.getFamilyChildren(ctx.user.id)
      ),
      add: protectedProcedure
        .input(z.object({ name: z.string().trim().min(1).max(60) }))
        .mutation(async ({ ctx, input }) => {
          const id = await db.addFamilyChild({
            userId: ctx.user.id,
            name: input.name.trim(),
          });
          return { id };
        }),
      rename: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            name: z.string().trim().min(1).max(60),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const child = await db.getFamilyChild(input.id, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kind nicht gefunden.",
            });
          }
          await db.renameFamilyChild(input.id, ctx.user.id, input.name.trim());
          return { success: true } as const;
        }),
      /**
       * Punkte-Schalter (#370): Ämtli machen alle, in der Rangliste
       * stehen nur die, die im Wettbewerb sind.
       */
      setEarnsPoints: protectedProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            earnsPoints: z.boolean(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const child = await db.getFamilyChild(input.id, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Person nicht gefunden.",
            });
          }
          await db.setFamilyChildEarnsPoints(
            input.id,
            ctx.user.id,
            input.earnsPoints
          );
          return { success: true } as const;
        }),
      /**
       * Kind entfernen – Abzeichen, Zähler und Reisepass-Einträge gehen
       * mit.
       */
      remove: protectedProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(({ ctx, input }) =>
          db.deleteFamilyChild(input.id, ctx.user.id)
        ),
    }),
    /**
     * Reisepass (#292): wer war auf welcher Reise dabei.
     *
     * Gespeichert wird die ABWESENHEIT – ohne Eintrag war die Person
     * dabei. Begründung in shared/passport.ts.
     */
    passport: router({
      absences: protectedProcedure.query(({ ctx }) =>
        db.getPassportAbsences(ctx.user.id)
      ),
      setPresence: protectedProcedure
        .input(
          z.object({
            childId: z.number().int().positive(),
            tripId: z.number().int().positive(),
            present: z.boolean(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          // Beide Seiten prüfen: Ohne das könnte man über eine fremde
          // childId oder tripId Zeilen im eigenen Konto anlegen, die auf
          // fremde Daten zeigen.
          const child = await db.getFamilyChild(input.childId, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Person nicht gefunden.",
            });
          }
          const trip = await db.getTripLog(input.tripId, ctx.user.id);
          if (!trip) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Reise nicht gefunden.",
            });
          }
          await db.setPassportPresence(
            ctx.user.id,
            input.childId,
            input.tripId,
            input.present
          );
          return { success: true } as const;
        }),
    }),
    badges: router({
      /** Abzeichen eines eigenen Kindes (leere Liste bei fremder childId). */
      listByChild: protectedProcedure
        .input(z.object({ childId: z.number().int().positive() }))
        .query(async ({ ctx, input }) => {
          const child = await db.getFamilyChild(input.childId, ctx.user.id);
          if (!child) {
            return [] as Awaited<ReturnType<typeof db.getChildBadges>>;
          }
          return db.getChildBadges(ctx.user.id, input.childId);
        }),
      /** Abzeichen vergeben – idempotent (zweite Vergabe ist ein No-op). */
      award: protectedProcedure
        .input(
          z.object({
            childId: z.number().int().positive(),
            badgeId: z.string().min(1).max(40),
          })
        )
        .mutation(async ({ ctx, input }) => {
          if (!isBadgeId(input.badgeId)) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Unbekanntes Abzeichen.",
            });
          }
          const child = await db.getFamilyChild(input.childId, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kind nicht gefunden.",
            });
          }
          await db.awardChildBadge(ctx.user.id, input.childId, input.badgeId);
          return { success: true } as const;
        }),
    }),
    stats: router({
      /**
       * Abgeschlossene Jagd/Quiz atomar in den Zählern des Kindes
       * fortschreiben; liefert den neuen Stand für die Abzeichen-Prüfung.
       */
      record: protectedProcedure
        .input(
          z.object({
            childId: z.number().int().positive(),
            type: z.enum(["huntCompleted", "quizCompleted"]),
            correctStreak: z.number().int().min(0).max(1000).optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const child = await db.getFamilyChild(input.childId, ctx.user.id);
          if (!child) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Kind nicht gefunden.",
            });
          }
          const stats = await db.recordChildEvent(
            ctx.user.id,
            input.childId,
            input.type === "huntCompleted"
              ? { hunt: true }
              : { quiz: true, streak: input.correctStreak }
          );
          return {
            huntsCompleted: stats?.huntsCompleted ?? 0,
            quizzesCompleted: stats?.quizzesCompleted ?? 0,
            bestStreak: stats?.bestStreak ?? 0,
          };
        }),
    }),
  }),
  /**
   * Belohnungs-Ziele (#399): Punkte aus dem Ämtli-Plan einlösen.
   *
   * DIE EINLÖSUNG PRÜFT SERVERSEITIG gegen den echten Punktestand –
   * dieselbe Rechnung wie die Rangliste (scoreboard), minus bereits
   * Eingelöstes. Ein Klient, der mehr behauptet, bekommt einen Fehler,
   * keine Belohnung.
   */
  rewards: router({
    list: protectedProcedure.query(({ ctx }) =>
      db.getFamilyRewards(ctx.user.id)
    ),
    redemptions: protectedProcedure.query(({ ctx }) =>
      db.getFamilyRedemptions(ctx.user.id)
    ),
    add: protectedProcedure
      .input(
        z.object({
          title: z.string().trim().min(1).max(REWARD_TITLE_MAX_LENGTH),
          points: z.number().int(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const existing = await db.getFamilyRewards(ctx.user.id);
        if (existing.length >= MAX_REWARDS) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Mehr als ${MAX_REWARDS} Ziele sind nicht vorgesehen.`,
          });
        }
        const id = await db.addFamilyReward({
          userId: ctx.user.id,
          title: input.title.trim(),
          points: clampRewardPoints(input.points),
        });
        return { id } as const;
      }),
    remove: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteFamilyReward(input.id, ctx.user.id);
        return { success: true } as const;
      }),
    redeem: protectedProcedure
      .input(
        z.object({
          rewardId: z.number().int().positive(),
          childId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const [rewards, children, chores, assignments, redemptions] =
          await Promise.all([
            db.getFamilyRewards(ctx.user.id),
            db.getFamilyChildren(ctx.user.id),
            db.getCampChores(ctx.user.id),
            db.getChoreAssignments(ctx.user.id),
            db.getFamilyRedemptions(ctx.user.id),
          ]);
        const reward = rewards.find(r => r.id === input.rewardId);
        const child = children.find(c => c.id === input.childId);
        if (!reward || !child) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Ziel oder Kind nicht gefunden.",
          });
        }
        const earned =
          scoreboard(children, chores, assignments).find(
            row => row.childId === child.id
          )?.points ?? 0;
        if (availablePoints(earned, redemptions, child.id) < reward.points) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Die Punkte reichen noch nicht.",
          });
        }
        // Schnappschuss statt Verweis – Begründung am Tabellen-Schema.
        const id = await db.addFamilyRedemption({
          userId: ctx.user.id,
          childId: child.id,
          title: reward.title,
          points: reward.points,
        });
        return { id } as const;
      }),
  }),
};
