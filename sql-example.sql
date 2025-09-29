-- Arquivo SQL de exemplo gerado automaticamente
-- Este arquivo mostra como os dados dos JSONs são processados

-- Criar tabelas
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  last_updated TEXT
);

CREATE TABLE IF NOT EXISTS sets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  release_date TEXT,
  card_count INTEGER,
  series_id TEXT NOT NULL,
  last_updated TEXT,
  FOREIGN KEY (series_id) REFERENCES series (id)
);

CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT,
  rarity TEXT,
  set_id TEXT NOT NULL,
  series_id TEXT NOT NULL,
  price REAL,
  hp INTEGER,
  local_id TEXT,
  types TEXT,
  attacks TEXT,
  weaknesses TEXT,
  resistances TEXT,
  category TEXT,
  illustrator TEXT,
  dex_id TEXT,
  stage TEXT,
  retreat INTEGER,
  legal TEXT,
  variants TEXT,
  variants_detailed TEXT,
  updated TEXT,
  last_updated TEXT,
  FOREIGN KEY (set_id) REFERENCES sets (id),
  FOREIGN KEY (series_id) REFERENCES series (id)
);

-- Inserir dados de exemplo (primeiras 10 cartas de cada categoria)

-- Inserir séries (exemplo)
INSERT OR REPLACE INTO series (id, name, logo, last_updated) VALUES ('base', 'Coleção Básica', NULL, '2025-09-29T21:01:11.650Z');
INSERT OR REPLACE INTO series (id, name, logo, last_updated) VALUES ('ex', 'EX', NULL, '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO series (id, name, logo, last_updated) VALUES ('dp', 'Diamante & Pérola', NULL, '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO series (id, name, logo, last_updated) VALUES ('hgss', 'HeartGold SoulSilver', NULL, '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO series (id, name, logo, last_updated) VALUES ('col', 'Chamado das Lendas', NULL, '2025-09-29T21:01:11.651Z');

-- Inserir sets (exemplo)
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('base1', 'Coleção Básica', NULL, NULL, 102, 'base', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('base2', 'Selva', 'https://assets.tcgdex.net/univ/base/base2/symbol', NULL, 64, 'base', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('base3', 'Fóssil', 'https://assets.tcgdex.net/univ/base/base3/symbol', NULL, 62, 'base', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('ex1', 'EX Rubi e Safira', 'https://assets.tcgdex.net/univ/ex/ex1/symbol', NULL, 109, 'ex', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('ex7', 'EX O Retorno da Equipe Rocket ', 'https://assets.tcgdex.net/univ/ex/ex7/symbol', NULL, 109, 'ex', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('ex8', 'EX Deoxys', 'https://assets.tcgdex.net/univ/ex/ex8/symbol', NULL, 107, 'ex', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('ex9', 'EX Esmeralda', 'https://assets.tcgdex.net/univ/ex/ex9/symbol', NULL, 106, 'ex', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('ex10', 'EX Forças Ocultas', 'https://assets.tcgdex.net/univ/ex/ex10/symbol', NULL, 115, 'ex', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('dp1', 'Diamante & Pérola', 'https://assets.tcgdex.net/univ/dp/dp1/symbol', NULL, 130, 'dp', '2025-09-29T21:01:11.651Z');
INSERT OR REPLACE INTO sets (id, name, logo, release_date, card_count, series_id, last_updated) VALUES ('dp2', 'Tesouros Misteriosos', 'https://assets.tcgdex.net/univ/dp/dp2/symbol', NULL, 122, 'dp', '2025-09-29T21:01:11.651Z');

-- Inserir cartas (exemplo)
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-1',
        'Snivy',
        'https://assets.tcgdex.net/pt/bw/bw1/1',
        'Comum',
        'bw1',
        'bw',
        NULL,
        60,
        '1',
        '["Planta"]',
        '[{"cost":["Planta"],"damage":10},{"cost":["Planta","Incolor"],"damage":20}]',
        '[{"type":"Fogo","value":"×2"}]',
        '[{"type":"Água","value":"-20"}]',
        'Pokemon',
        'Kagemaru Himeno',
        '[495]',
        'Básico',
        1,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-10',
        'Lilligant',
        'https://assets.tcgdex.net/pt/bw/bw1/10',
        'Rara',
        'bw1',
        'bw',
        NULL,
        80,
        '10',
        '["Planta"]',
        '[{"cost":["Planta"],"damage":30},{"cost":["Planta","Incolor"],"damage":30}]',
        '[{"type":"Fogo","value":"×2"}]',
        '[{"type":"Água","value":"-20"}]',
        'Pokemon',
        'Atsuko Nishida',
        '[549]',
        'Estágio 1',
        1,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-100',
        'Poção',
        'https://assets.tcgdex.net/pt/bw/bw1/100',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '100',
        '[]',
        '[]',
        '[]',
        '[]',
        'Treinador',
        'Ayaka Yoshida',
        '[]',
        NULL,
        NULL,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-101',
        'Professor Juniper',
        'https://assets.tcgdex.net/pt/bw/bw1/101',
        'Incomum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '101',
        '[]',
        '[]',
        '[]',
        '[]',
        'Treinador',
        'Ken Sugimori',
        '[]',
        NULL,
        NULL,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-102',
        'Reviver',
        'https://assets.tcgdex.net/pt/bw/bw1/102',
        'Incomum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '102',
        '[]',
        '[]',
        '[]',
        '[]',
        'Treinador',
        '5ban Graphics',
        '[]',
        NULL,
        NULL,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-103',
        'Super Colherada',
        'https://assets.tcgdex.net/pt/bw/bw1/103',
        'Incomum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '103',
        '[]',
        '[]',
        '[]',
        '[]',
        'Treinador',
        'Daisuke Iwamoto',
        '[]',
        NULL,
        NULL,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-104',
        'Substituição',
        'https://assets.tcgdex.net/pt/bw/bw1/104',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '104',
        '[]',
        '[]',
        '[]',
        '[]',
        'Treinador',
        'Ayaka Yoshida',
        '[]',
        NULL,
        NULL,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-105',
        'Energia de Grama',
        'https://assets.tcgdex.net/pt/bw/bw1/105',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '105',
        '[]',
        '[]',
        '[]',
        '[]',
        'Energia',
        NULL,
        '[]',
        'Básico',
        NULL,
        '{"standard":true,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-106',
        'Energia de Fogo',
        'https://assets.tcgdex.net/pt/bw/bw1/106',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '106',
        '[]',
        '[]',
        '[]',
        '[]',
        'Energia',
        NULL,
        '[]',
        'Básico',
        NULL,
        '{"standard":true,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-107',
        'Energia de Água',
        'https://assets.tcgdex.net/pt/bw/bw1/107',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '107',
        '[]',
        '[]',
        '[]',
        '[]',
        'Energia',
        NULL,
        '[]',
        'Básico',
        NULL,
        '{"standard":true,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-108',
        'Energia de Raios',
        'https://assets.tcgdex.net/pt/bw/bw1/108',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '108',
        '[]',
        '[]',
        '[]',
        '[]',
        'Energia',
        NULL,
        '[]',
        'Básico',
        NULL,
        '{"standard":true,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-109',
        'Energia Psíquica',
        'https://assets.tcgdex.net/pt/bw/bw1/109',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '109',
        '[]',
        '[]',
        '[]',
        '[]',
        'Energia',
        NULL,
        '[]',
        'Básico',
        NULL,
        '{"standard":true,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-11',
        'Maractus',
        'https://assets.tcgdex.net/pt/bw/bw1/11',
        'Incomum',
        'bw1',
        'bw',
        NULL,
        80,
        '11',
        '["Planta"]',
        '[{"cost":["Planta"],"damage":20},{"cost":["Planta","Planta","Incolor"],"damage":20}]',
        '[{"type":"Fogo","value":"×2"}]',
        '[{"type":"Água","value":"-20"}]',
        'Pokemon',
        'Kagemaru Himeno',
        '[556]',
        'Básico',
        2,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-110',
        'Energia de Luta',
        'https://assets.tcgdex.net/pt/bw/bw1/110',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '110',
        '[]',
        '[]',
        '[]',
        '[]',
        'Energia',
        NULL,
        '[]',
        'Básico',
        NULL,
        '{"standard":true,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-111',
        'Energia Noturna',
        'https://assets.tcgdex.net/pt/bw/bw1/111',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '111',
        '[]',
        '[]',
        '[]',
        '[]',
        'Energia',
        NULL,
        '[]',
        'Básico',
        NULL,
        '{"standard":true,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-112',
        'Energia de Metal',
        'https://assets.tcgdex.net/pt/bw/bw1/112',
        'Comum',
        'bw1',
        'bw',
        NULL,
        NULL,
        '112',
        '[]',
        '[]',
        '[]',
        '[]',
        'Energia',
        NULL,
        '[]',
        'Básico',
        NULL,
        '{"standard":true,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-113',
        'Reshiram',
        'https://assets.tcgdex.net/pt/bw/bw1/113',
        'Ultra Rara',
        'bw1',
        'bw',
        NULL,
        130,
        '113',
        '["Fogo"]',
        '[{"cost":["Incolor","Incolor"],"damage":20},{"cost":["Fogo","Fogo","Incolor"],"damage":120}]',
        '[{"type":"Água","value":"×2"}]',
        '[]',
        'Pokemon',
        '5ban Graphics',
        '[643]',
        'Básico',
        2,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-114',
        'Zekrom',
        'https://assets.tcgdex.net/pt/bw/bw1/114',
        'Ultra Rara',
        'bw1',
        'bw',
        NULL,
        130,
        '114',
        '["Elétrico"]',
        '[{"cost":["Incolor","Incolor"],"damage":20},{"cost":["Elétrico","Elétrico","Incolor"],"damage":120}]',
        '[{"type":"Lutador","value":"×2"}]',
        '[]',
        'Pokemon',
        '5ban Graphics',
        '[644]',
        'Básico',
        2,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-115',
        'Pikachu',
        'https://assets.tcgdex.net/pt/bw/bw1/115',
        'Rare Secreta',
        'bw1',
        'bw',
        NULL,
        60,
        '115',
        '["Elétrico"]',
        '[{"cost":["Elétrico"]},{"cost":["Elétrico","Incolor","Incolor"],"damage":80}]',
        '[{"type":"Lutador","value":"×2"}]',
        '[]',
        'Pokemon',
        'Kouki Saitou',
        '[25]',
        'Básico',
        1,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
INSERT OR REPLACE INTO cards (
        id, name, image, rarity, set_id, series_id, price, hp, local_id,
        types, attacks, weaknesses, resistances, category, illustrator,
        dex_id, stage, retreat, legal, variants, variants_detailed, updated, last_updated
      ) VALUES (
        'bw1-12',
        'Maractus',
        'https://assets.tcgdex.net/pt/bw/bw1/12',
        'Rara',
        'bw1',
        'bw',
        NULL,
        90,
        '12',
        '["Planta"]',
        '[{"cost":["Planta"]},{"cost":["Planta","Planta","Planta"],"damage":50}]',
        '[{"type":"Fogo","value":"×2"}]',
        '[{"type":"Água","value":"-20"}]',
        'Pokemon',
        'Kouki Saitou',
        '[556]',
        'Básico',
        2,
        '{"standard":false,"expanded":true}',
        '{"firstEdition":false,"holo":true,"normal":true,"reverse":true,"wPromo":false}',
        '[{"type":"normal","size":"standard"},{"type":"reverse","size":"standard"},{"type":"holo","size":"standard"}]',
        '2025-08-16T20:39:55Z',
        '2025-09-29T21:01:11.651Z'
      );
