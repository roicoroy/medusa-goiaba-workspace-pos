import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260828153838 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "cash_register" ("id" text not null, "name" text not null, "status" text check ("status" in ('open', 'closed')) not null default 'closed', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "cash_register_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_cash_register_deleted_at" ON "cash_register" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pos_session" ("id" text not null, "cash_register_id" text not null, "status" text check ("status" in ('open', 'closed')) not null default 'open', "opening_float" numeric not null, "closing_cash" numeric null, "opened_at" timestamptz not null, "closed_at" timestamptz null, "raw_opening_float" jsonb not null, "raw_closing_cash" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pos_session_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_session_cash_register_id" ON "pos_session" ("cash_register_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_session_deleted_at" ON "pos_session" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "pos_report" ("id" text not null, "pos_session_id" text not null, "type" text check ("type" in ('x_report', 'z_report')) not null, "total_sales" numeric not null, "tax_total" numeric not null, "payment_breakdown" jsonb not null, "generated_at" timestamptz not null, "raw_total_sales" jsonb not null, "raw_tax_total" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "pos_report_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_report_pos_session_id" ON "pos_report" ("pos_session_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_pos_report_deleted_at" ON "pos_report" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "pos_session" add constraint "pos_session_cash_register_id_foreign" foreign key ("cash_register_id") references "cash_register" ("id") on update cascade;`);

    this.addSql(`alter table if exists "pos_report" add constraint "pos_report_pos_session_id_foreign" foreign key ("pos_session_id") references "pos_session" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "pos_session" drop constraint if exists "pos_session_cash_register_id_foreign";`);

    this.addSql(`alter table if exists "pos_report" drop constraint if exists "pos_report_pos_session_id_foreign";`);

    this.addSql(`drop table if exists "cash_register" cascade;`);

    this.addSql(`drop table if exists "pos_session" cascade;`);

    this.addSql(`drop table if exists "pos_report" cascade;`);
  }

}
