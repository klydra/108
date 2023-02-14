package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		jsonData := `{
			"id": "0lu69o7sb781pvs",
			"created": "",
			"updated": "",
			"name": "games",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "resdif92",
					"name": "players",
					"type": "json",
					"required": true,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "xv694u2s",
					"name": "live",
					"type": "text",
					"required": false,
					"unique": false,
					"options": {
						"min": 15,
						"max": 15,
						"pattern": "^[A-Z0-9]+$"
					}
				},
				{
					"system": false,
					"id": "a9cxrz8j",
					"name": "rules",
					"type": "json",
					"required": true,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "0zbw13nx",
					"name": "stack",
					"type": "json",
					"required": true,
					"unique": false,
					"options": {}
				}
			],
			"listRule": "",
			"viewRule": null,
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db)

		collection, err := dao.FindCollectionByNameOrId("0lu69o7sb781pvs")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
