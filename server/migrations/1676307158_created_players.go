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
			"id": "tlslq2931578jvp",
			"created": "",
			"updated": "",
			"name": "players",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "9ty9j6ed",
					"name": "name",
					"type": "text",
					"required": true,
					"unique": false,
					"options": {
						"min": 26,
						"max": 26,
						"pattern": "^[A-Z0-9]+$"
					}
				},
				{
					"system": false,
					"id": "pzbow0h0",
					"name": "game",
					"type": "text",
					"required": false,
					"unique": false,
					"options": {
						"min": 15,
						"max": 15,
						"pattern": "^[a-z0-9]+$"
					}
				},
				{
					"system": false,
					"id": "yoc3plly",
					"name": "hand",
					"type": "json",
					"required": true,
					"unique": false,
					"options": {}
				}
			],
			"listRule": null,
			"viewRule": "",
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

		collection, err := dao.FindCollectionByNameOrId("tlslq2931578jvp")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
