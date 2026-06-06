import pandas as pd


url = "https://archive.ics.uci.edu/ml/machine-learning-databases/autos/imports-85.data"
df = pd.read_csv(url, header=None)
headers = [ "symboling","normalized-losses","make", "fuel-type","aspiration", "num-of-doors","body-style", 
           "drive-wheels","engine-location","wheel-base", "length"," width","height","curb-weight","engine-type",
"num-of-cylinders", "engine-size", "fuel-system","bore","stroke","compression-ratio", "horsepower", "peak-rpm",
"city-mpg","highway-mpg","price"]
df.columns = headers
print(df.head(5))
path="/Users/primeshofficial/Documents/COURSERA DA/IBM Data Analyst using python/Output/import.csv"
df.to_csv(path, index=False)
print(df.dtypes)
print(df.describe(include="all"))
df.info()