import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

/**
 * Console entry point for the Smart Agricultural Irrigation System.
 */
public class Main {

    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);

        IrrigationHistory history = new IrrigationHistory("irrigation_history.csv");
        HashMap<String, Double> waterRates = defaultWaterRates();

        IrrigationManager manager = new IrrigationManager(waterRates);

        System.out.println("==========================================");
        System.out.println(" SMART AGRICULTURAL IRRIGATION SYSTEM");
        System.out.println("==========================================");
        System.out.println("Zone type: 1. Agricultural Field  2. Campus Plant Zone");

        int count = readInt(scanner, "\nEnter number of fields / plant zones: ", 1, 100);

        for (int i = 1; i <= count; i++) {
            System.out.println("\n--- Zone " + i + " ---");
            System.out.print("Enter zone name: ");
            String zoneName = readNonEmptyLine(scanner);

            System.out.print("Enter crop / plant name: ");
            String plantName = readNonEmptyLine(scanner);

            double area = readDouble(scanner, "Enter area (acres): ", 0.0001, 1_000_000);
            double moisture = readDouble(scanner, "Enter soil moisture (%): ", 0, 100);

            Double rate = findRate(waterRates, plantName);
            if (rate == null) {
                rate = readDouble(scanner,
                    "Crop/plant not found. Enter water requirement (litres/acre): ",
                    0, 1_000_000_000);
            }
            // Store rates only in this run's in-memory map, never in the history file.
            waterRates.put(plantName, rate);

            int zoneType = readInt(scanner,
                "Select zone type (1 = Agricultural Field, 2 = Campus Plant Zone): ",
                1, 2);

            IrrigationZone zone;
            if (zoneType == 1) {
                zone = new AgriculturalField(zoneName, plantName, area, moisture);
            } else {
                zone = new CampusPlantZone(zoneName, plantName, area, moisture);
            }

            manager.addZone(zone);
            System.out.println("Zone added successfully!");
        }

        double availableWater = readDouble(
            scanner, "\nEnter total available water (litres): ", 0, 1_000_000_000);

        try {
            manager.calculateRequirements();
            manager.calculatePriorities();
            manager.allocateWater(availableWater);

            double totalRequired = 0.0;
            double totalAllocated = 0.0;
            for (IrrigationZone zone : manager.getZones()) {
                totalRequired += zone.getTotalWaterRequirement();
                totalAllocated += zone.getAllocatedWater();
            }
            totalAllocated = Math.min(availableWater, totalAllocated);
            double remainingWater = Math.max(0.0, availableWater - totalAllocated);

            history.appendIrrigationRecords(manager.getZones(), availableWater,
                    totalRequired, totalAllocated, remainingWater);
            System.out.println("Irrigation history saved to irrigation_history.csv.");
        } catch (IOException | IllegalArgumentException e) {
            System.err.println("Could not complete/save irrigation run: " + e.getMessage());
            System.err.println("Check that irrigation_history.csv is not open in another program, then try again.");
        } finally {
            scanner.close();
        }
    }

    private static HashMap<String, Double> defaultWaterRates() {
        HashMap<String, Double> rates = new HashMap<>();
        rates.put("Tomato", 1500.0);
        rates.put("Rice", 2000.0);
        rates.put("Paddy", 2000.0);
        rates.put("Vegetables", 1200.0);
        rates.put("Flower Plants", 1000.0);
        rates.put("Grass", 800.0);
        rates.put("Mango", 1800.0);
        return rates;
    }

    private static Double findRate(HashMap<String, Double> rates, String plantName) {
        for (Map.Entry<String, Double> entry : rates.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(plantName.trim())) return entry.getValue();
        }
        return null;
    }

    private static int readInt(Scanner scanner, String prompt, int min, int max) {
        while (true) {
            System.out.print(prompt);
            String input = scanner.nextLine().trim();
            try {
                int value = Integer.parseInt(input);
                if (value >= min && value <= max) {
                    return value;
                }
            } catch (NumberFormatException ignored) {
                // Ask again below.
            }
            System.out.println("Please enter a whole number between " + min + " and " + max + ".");
        }
    }

    private static double readDouble(Scanner scanner, String prompt, double min, double max) {
        while (true) {
            System.out.print(prompt);
            String input = scanner.nextLine().trim();
            try {
                double value = Double.parseDouble(input);
                if (Double.isFinite(value) && value >= min && value <= max) {
                    return value;
                }
            } catch (NumberFormatException ignored) {
                // Ask again below.
            }
            System.out.println("Please enter a number between " + min + " and " + max + ".");
        }
    }

    private static String readNonEmptyLine(Scanner scanner) {
        while (true) {
            String value = scanner.nextLine().trim();
            if (!value.isEmpty()) {
                return value;
            }
            System.out.print("This value cannot be empty. Please enter it again: ");
        }
    }
}
