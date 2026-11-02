/**
 * Abstract parent class for every area managed by the irrigation system.
 *
 * Common information and calculations are kept here so that all zone types
 * can be stored and processed through the same parent-class reference.
 */
public abstract class IrrigationZone {
    private final String zoneName;
    private final String plantName;
    private final double area;
    private final double soilMoisture;
    private double totalWaterRequirement;
    private double priorityScore;
    private double allocatedWater;

    protected IrrigationZone(String zoneName, String plantName,
                             double area, double soilMoisture) {
        this.zoneName = zoneName;
        this.plantName = plantName;
        this.area = area;
        this.soilMoisture = soilMoisture;
    }

    public String getZoneName() {
        return zoneName;
    }

    public String getPlantName() {
        return plantName;
    }

    public double getArea() {
        return area;
    }

    public double getSoilMoisture() {
        return soilMoisture;
    }

    public double getTotalWaterRequirement() {
        return totalWaterRequirement;
    }

    public void setTotalWaterRequirement(double totalWaterRequirement) {
        this.totalWaterRequirement = totalWaterRequirement;
    }

    public double getPriorityScore() {
        return priorityScore;
    }

    public void setPriorityScore(double priorityScore) {
        this.priorityScore = priorityScore;
    }

    public double getAllocatedWater() {
        return allocatedWater;
    }

    public void setAllocatedWater(double allocatedWater) {
        this.allocatedWater = allocatedWater;
    }

    /**
     * Each subclass determines its water requirement using its plant/crop rate.
     */
    public abstract void calculateWaterRequirement(double waterRatePerAcre);
}
