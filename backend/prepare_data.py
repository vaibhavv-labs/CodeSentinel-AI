from datasets import load_dataset
import pandas as pd

# Free dataset from HuggingFace
dataset = load_dataset("claudios/sven-SecurityEval")
df = pd.DataFrame(dataset['train'])
df.to_csv("training_data.csv", index=False)
print("Data ready!", df.shape)