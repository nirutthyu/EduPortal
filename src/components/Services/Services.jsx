  import React from "react";
  import { useNavigate } from "react-router-dom"; // Import navigation hook
  import { RiComputerLine } from "react-icons/ri";
  import { CiMobile3 } from "react-icons/ci";
  import { TbWorldWww } from "react-icons/tb";
  import { IoPulseOutline } from "react-icons/io5";
  import { GrCloudComputer } from "react-icons/gr";
  import { RiComputerFill } from "react-icons/ri";
  import { motion } from "framer-motion";
 

  const ServicesData = [
    {
      id: 1,
      title: "Web Development",
      link: "/courses/1",
      icon: <TbWorldWww />,
      delay: 0.2,
    },
    {
      id: 2,
      title: "Mobile Development",
      link: "/courses/2",
      icon: <CiMobile3 />,
      delay: 0.3,
    },
    {
      id: 3,
      title: "Data Structures",
      link: "/courses/3",
      icon: <RiComputerLine />,
      delay: 0.4,
    },
    {
      id: 4,
      title: "Machine Learning",
      link: "/courses/4",
      icon: <GrCloudComputer />,
      delay: 0.5,
    },
    {
      id: 5,
      title: "Object Oriented Programming",
      link: "/courses/5",
      icon: <IoPulseOutline />,
      delay: 0.6,
    },
    {
      id: 6,
      title: "Artificial Intelligence",
      link: "/courses/6",
      icon: <RiComputerFill />,
      delay: 0.7,
    },
  ];

  const SlideLeft = (delay) => {
    return {
      initial: {
        opacity: 0,
        x: 50,
      },
      animate: {
        opacity: 1,
        x: 0,
        transition: {
          duration: 0.3,
          delay: delay,
          ease: "easeInOut",
        },
      },
    };
  };

  const Services = () => {
    const navigate = useNavigate();

    return (
      <section className="bg-white">
        <div className="container pb-14 pt-16">
          <h1 className="text-4xl font-bold text-left pb-10">Courses we provide</h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-8">
            {ServicesData.map((service) => (
              <motion.div
                key={service.id}
                variants={SlideLeft(service.delay)}
                initial="initial"
                whileInView={"animate"}
                viewport={{ once: true }}
                onClick={() =>  navigate(service.link, { state: { title: service.title } })} // Navigate to course detail
                className="cursor-pointer bg-[#f4f4f4] rounded-2xl flex flex-col gap-4 items-center justify-center p-4 py-7 hover:bg-white hover:scale-110 duration-300 hover:shadow-2xl"
              >
                <div className="text-4xl mb-4"> {service.icon}</div>
                <h1 className="text-lg font-semibold text-center px-3">
                  {service.title}
                </h1>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  export default Services;
