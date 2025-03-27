CREATE VIEW "public"."v_transactions_internal" AS (
    SELECT
      "transactions"."id",
      "transactions"."isParent" AS is_parent,
      "transactions"."isChild" AS is_child,
      CASE WHEN "transactions"."isChild" IS FALSE THEN NULL ELSE "transactions"."parent_id" END AS parent_id,
      "transactions"."acct" AS account,
      CASE WHEN "transactions"."isParent" IS TRUE THEN NULL ELSE "category_mapping"."transferId" END AS category,
      COALESCE("transactions"."amount", 0) AS amount,
      "payee_mapping"."targetId" AS payee,
      "transactions"."notes",
      "transactions"."date",
      "transactions"."financial_id" AS imported_id,
      "transactions"."error",
      "transactions"."imported_description" AS imported_payee,
      "transactions"."starting_balance_flag",
      "transactions"."transferred_id" AS transfer_id,
      "transactions"."schedule",
      "transactions"."cleared",
      "transactions"."reconciled",
      "transactions"."tombstone",
      "transactions"."sort_order"
    FROM
      "transactions"
    LEFT JOIN
      "category_mapping"
        ON "transactions"."category" = "category_mapping"."id"
    LEFT JOIN
      "payee_mapping"
        ON "transactions"."description" = "payee_mapping"."id"
    WHERE
      "transactions"."date" IS NOT NULL
      AND "transactions"."acct" IS NOT NULL
      AND ("transactions"."isChild" IS FALSE OR "transactions"."parent_id" IS NOT NULL)
  );