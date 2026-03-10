import joblib

# 加载grade_mapping
grade_mapping = joblib.load('models/grade_mapping.pkl')
print("Grade mapping type:", type(grade_mapping))
print("Grade mapping content:", grade_mapping)
print("Grade mapping items:")
for key, value in grade_mapping.items():
    print(f"  {key} (type: {type(key)}): {value} (type: {type(value)})")
