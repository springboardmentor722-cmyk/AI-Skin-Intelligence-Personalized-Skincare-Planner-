import pandas as pd

products = pd.read_csv("product_info.csv")

print(products.columns.tolist())  
# Dictionary to store unique ingredients
ingredient_dict = {}
ingredient_id = 1

# List for mapping
mapping = []

for _, row in products.iterrows():

    product_id = row["product_id"]

    # Skip empty ingredient lists
    if pd.isna(row["ingredients"]):
        continue

    # Split ingredients
    ingredient_list = [x.strip() for x in str(row["ingredients"]).split(",")]

    for ing in ingredient_list:

        if ing == "":
            continue

        if ing not in ingredient_dict:
            ingredient_dict[ing] = ingredient_id
            ingredient_id += 1

        mapping.append({
            "product_id": product_id,
            "ingredient_id": ingredient_dict[ing]
        })

# Create ingredients table
ingredients_df = pd.DataFrame(
    [
        {
            "ingredient_id": v,
            "ingredient_name": k
        }
        for k, v in ingredient_dict.items()
    ]
)

# Create mapping table
mapping_df = pd.DataFrame(mapping)

# Save files
ingredients_df.to_csv("ingredients_generated.csv", index=False)
mapping_df.to_csv("product_ingredients.csv", index=False)

print("✅ ingredients_generated.csv created")
print("✅ product_ingredients.csv created")
print(f"Total Ingredients : {len(ingredients_df)}")
print(f"Total Mappings    : {len(mapping_df)}")