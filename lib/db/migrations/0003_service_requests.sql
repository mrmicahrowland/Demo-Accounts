CREATE TYPE service_request_type AS ENUM ('installation', 'repair', 'upgrade', 'maintenance', 'emergency');
CREATE TYPE service_request_status AS ENUM ('submitted', 'reviewing', 'quoted', 'scheduled', 'closed', 'cancelled');
CREATE TABLE service_requests (
  id serial PRIMARY KEY,
  client_id integer NOT NULL REFERENCES users(id),
  type service_request_type NOT NULL,
  status service_request_status NOT NULL DEFAULT 'submitted',
  description text NOT NULL,
  service_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip text NOT NULL,
  gate_material text,
  gate_configuration text,
  gate_length_feet text,
  gate_height_feet text,
  existing_operator text,
  image_urls text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX service_requests_client_id_idx ON service_requests(client_id);
