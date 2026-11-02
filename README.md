# Smart Agricultural Irrigation System

A simple Java console application that calculates crop/plant water requirements, ranks zones by priority, allocates available water, and appends each completed run to a CSV history file.

## Requirements

- Java JDK installed (JDK 8 or newer)
- No Maven, Apache POI, Excel library, internet connection, or database server is required.

## Run on Windows (easiest)

1. Extract the ZIP to a folder, for example `E:\\MiniProject`.
2. Double-click `run.bat`.
3. Enter the zone details when prompted.
4. The history is saved in `irrigation_history.csv` in the project folder.

Alternatively, open PowerShell in the extracted project folder and run:

```powershell
javac -encoding UTF-8 -d out src\*.java
java -cp out Main
```

Check that Java is available with `java -version` and `javac -version`.

## Water rates

Default illustrative rates are kept in memory in `Main.java`:

| Crop/plant | Default rate (litres/acre) |
|---|---:|
| Tomato | 1500 |
| Rice | 2000 |
| Paddy | 2000 |
| Vegetables | 1200 |
| Flower Plants | 1000 |
| Grass | 800 |
| Mango | 1800 |

Crop names are matched without regard to capitalization. For an unknown crop/plant, the program asks for a rate; that value is used only during the current run. The rates are illustrative software defaults, not agronomic recommendations.

## CSV history

The application creates `irrigation_history.csv` automatically. The first run writes a header row; each completed run appends one row per zone without deleting previous records. The CSV can be opened in Excel, Notepad, or VS Code. Close it in Excel before running if Excel locks the file.

Columns:

1. Timestamp
2. Zone Name
3. Zone Type
4. Plant/Crop Name
5. Area (acres)
6. Soil Moisture (%)
7. Water Rate (litres/acre)
8. Required Water (L)
9. Priority Score
10. Allocated Water (L)
11. Irrigation Status
12. Available Water at Start (L)
13. Total Required Water for the Run (L)
14. Total Allocated Water for the Run (L)
15. Remaining Water (L)

The CSV uses standard escaping for commas and quotation marks in names. Remaining water is never recorded as negative.

## Project files

- `src/Main.java` — console input and program flow
- `src/IrrigationManager.java` — requirements, priority ranking and allocation
- `src/IrrigationZone.java` — shared zone model
- `src/AgriculturalField.java` — agricultural field type
- `src/CampusPlantZone.java` — campus plant zone type
- `src/IrrigationHistory.java` — CSV append-only history
- `run.bat` — compile and launch on Windows without Maven
