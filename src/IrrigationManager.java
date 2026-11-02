import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.PriorityQueue;

/**
 * Coordinates water-requirement calculations, priority ranking, and allocation.
 * The priority formula and greedy allocation policy match the original prototype.
 */
public class IrrigationManager {
    private final HashMap<String, Double> waterRates;
    private final ArrayList<IrrigationZone> zones;

    public IrrigationManager(HashMap<String, Double> waterRates) {
        this.waterRates = waterRates;
        this.zones = new ArrayList<>();
    }

    public void addZone(IrrigationZone zone) {
        zones.add(zone);
    }

    public ArrayList<IrrigationZone> getZones() {
        return zones;
    }

    public HashMap<String, Double> getWaterRates() {
        return waterRates;
    }

    public void calculateRequirements() {
        for (IrrigationZone zone : zones) {
            Double rate = waterRates.get(zone.getPlantName());

            // Unknown plant/crop names should be given a rate before this method.
            if (rate == null) {
                throw new IllegalArgumentException(
                    "No water rate found for: " + zone.getPlantName());
            }

            zone.calculateWaterRequirement(rate);
        }
    }

    public void calculatePriorities() {
        double maxRequirement = 0.0;

        for (IrrigationZone zone : zones) {
            if (zone.getTotalWaterRequirement() > maxRequirement) {
                maxRequirement = zone.getTotalWaterRequirement();
            }
        }

        // Avoid division by zero when there are no zones or all requirements are zero.
        for (IrrigationZone zone : zones) {
            double moistureDeficit = 100.0 - zone.getSoilMoisture();
            double waterDemandScore = 0.0;

            if (maxRequirement > 0.0) {
                waterDemandScore =
                    (zone.getTotalWaterRequirement() / maxRequirement) * 100.0;
            }

            double score = (moistureDeficit * 0.70)
                         + (waterDemandScore * 0.30);
            zone.setPriorityScore(score);
        }
    }

    public void allocateWater(double availableWater) {
        PriorityQueue<IrrigationZone> queue = new PriorityQueue<>(
            Comparator.comparingDouble(IrrigationZone::getPriorityScore).reversed()
        );
        queue.addAll(zones);

        System.out.println("\n==========================================");
        System.out.println("             WATER ALLOCATION");
        System.out.println("==========================================");

        double totalAllocated = 0.0;
        int fullyIrrigated = 0;
        int partiallyIrrigated = 0;
        int waiting = 0;
        int rank = 1;

        while (!queue.isEmpty()) {
            IrrigationZone zone = queue.poll();
            double required = zone.getTotalWaterRequirement();
            double allocated;

            if (availableWater >= required) {
                allocated = required;
                availableWater = Math.max(0.0, availableWater - required);
                fullyIrrigated++;
            } else if (availableWater > 0.0) {
                allocated = availableWater;
                availableWater = 0.0;
                partiallyIrrigated++;
            } else {
                allocated = 0.0;
                waiting++;
            }

            zone.setAllocatedWater(allocated);

            String status;
            if (allocated >= required) {
                status = "FULLY IRRIGATED";
            } else if (allocated > 0.0) {
                status = "PARTIALLY IRRIGATED";
            } else {
                status = "WAITING";
            }

            System.out.println("\nPriority " + rank);
            System.out.println("Zone       : " + zone.getZoneName());
            System.out.println("Plant/Crop : " + zone.getPlantName());
            System.out.printf("Priority   : %.2f%n", zone.getPriorityScore());
            System.out.printf("Required   : %.2f L%n", required);
            System.out.printf("Allocated  : %.2f L%n", allocated);
            System.out.println("Status     : " + status);

            totalAllocated += allocated;
            rank++;
        }

        double totalRequired = 0.0;
        for (IrrigationZone zone : zones) {
            totalRequired += zone.getTotalWaterRequirement();
        }

        System.out.println("\n==========================================");
        System.out.println("              FINAL SUMMARY");
        System.out.println("==========================================");
        System.out.printf("Total Water Required : %.2f L%n", totalRequired);
        System.out.printf("Total Water Allocated: %.2f L%n", totalAllocated);
        availableWater = Math.max(0.0, availableWater);
        System.out.printf("Remaining Water      : %.2f L%n", availableWater);
        System.out.println("Fully Irrigated      : " + fullyIrrigated);
        System.out.println("Partially Irrigated  : " + partiallyIrrigated);
        System.out.println("Waiting              : " + waiting);
        System.out.println("\nIRRIGATION PROCESS COMPLETED");
    }
}
