import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="dashboard">
        <Label>Home</Label>
        <Icon sf="house.fill" md="home" selectedColor={"#5856D6"} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf="gear" md="settings" selectedColor={"#5856D6"} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
